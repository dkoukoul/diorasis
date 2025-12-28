import { DiavgeiaClient } from "../infra/api/diavgeia.client";
import { prisma } from "../infra/db/prisma";

async function syncMetadata() {
  const client = new DiavgeiaClient();
  
  console.log("🔄 Syncing Decision Types...");
  const typesData = (await client.getDecisionTypes()) as any;
  const types = typesData.decisionTypes.map((t: any) => ({
    uid: t.uid,
    label: t.label,
    allowedInDecisions: t.allowedInDecisions,
  }));
  
  for (const type of types) {
    await prisma.decisionType.upsert({
      where: { uid: type.uid },
      update: type,
      create: type,
    });
  }
  console.log(`✅ Synced ${types.length} decision types.`);

  console.log("🔄 Syncing Organizations...");
  const orgsData = (await client.getOrganizations()) as any;
  const orgs = orgsData.organizations.map((o: any) => ({
    uid: o.uid,
    label: o.label,
  }));

  // Batch upsert for organizations (using loops for safety and simplicity in script)
  let count = 0;
  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { uid: org.uid },
      update: org,
      create: org,
    });
    count++;
    if (count % 100 === 0) console.log(`... ${count} / ${orgs.length}`);
  }
  console.log(`✅ Synced ${orgs.length} organizations.`);
}

async function syncRecentDecisions() {
  const client = new DiavgeiaClient();
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const fromDate = yesterday.toISOString().split('T')[0];
  const toDate = now.toISOString().split('T')[0];

  console.log(`🔄 Syncing decisions from ${fromDate} to ${toDate}...`);

  let page = 0;
  const size = 100;
  let totalSynced = 0;

  while (true) {
    const results = (await client.search({
      fromIssueDate: fromDate,
      toIssueDate: toDate,
      page,
      size,
    })) as any;

    if (!results.decisions || results.decisions.length === 0) break;

    for (const d of results.decisions) {
      try {
        const rawDate = d.publishDate || d.metadata?.publishDate;
        const publishDate = rawDate ? new Date(Number(rawDate)) : new Date();
        const amount = d.extraFieldValues?.amount || d.metadata?.extraFieldValues?.amount;

        // Simple data enrichment: extract region from subject if possible
        let region = null;
        const regions = ["ΑΘΗΝΑ", "ΘΕΣΣΑΛΟΝΙΚΗ", "ΚΡΗΤΗ", "ΠΑΤΡΑ", "ΠΕΙΡΑΙΑΣ"];
        for (const r of regions) {
          if (d.subject?.toUpperCase().includes(r)) {
            region = r;
            break;
          }
        }

        await prisma.decision.upsert({
          where: { ada: d.ada },
          update: {
            status: d.status,
            amount: amount,
            region: region,
          },
          create: {
            ada: d.ada,
            protocolNumber: d.protocolNumber || d.metadata?.protocolNumber,
            subject: d.subject || d.metadata?.subject,
            publishDate: isNaN(publishDate.getTime()) ? new Date() : publishDate,
            submissionTimestamp: d.submissionTimestamp?.toString(),
            decisionTypeId: d.decisionTypeId || d.metadata?.decisionTypeId,
            organizationId: d.organizationId || d.metadata?.organizationId,
            unitIds: d.unitIds || d.metadata?.unitIds || [],
            signerIds: d.signerIds || d.metadata?.signerIds || [],
            status: d.status,
            url: d.url,
            documentUrl: d.documentUrl,
            amount: amount,
            region: region,
          }
        });
        totalSynced++;
      } catch (err) {
        console.warn(`⚠️ Skipped decision ${d.ada}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log(`... page ${page} processed (${totalSynced} total synced so far)`);
    
    if (results.decisions.length < size) break;
    page++;
  }

  console.log(`✅ Synced ${totalSynced} recent decisions.`);
}

async function syncEconomicIndicators() {
  console.log("🔄 Syncing Economic Indicators from Bank of Greece...");
  const { BogClient } = await import("../infra/api/bog.client");
  const client = new BogClient();
  const indicators = await client.getIndicators();

  for (const indicator of indicators) {
    await prisma.economicIndicator.create({
      data: {
        name: indicator.name,
        category: indicator.category,
        value: indicator.value,
        unit: indicator.unit,
        period: indicator.period,
        source: "Bank of Greece",
        timestamp: indicator.timestamp,
        metadata: indicator.metadata as any,
      }
    });
  }
  console.log(`✅ Synced ${indicators.length} indicators.`);
}

async function syncSpiData() {
  console.log("🔄 Syncing Property Index from Spitogatos (SPI)...");
  const { SpitogatosClient } = await import("../infra/api/spitogatos.client");
  const client = new SpitogatosClient();
  let entries = await client.getSpiData();

  if (entries.length === 0) {
    console.warn("⚠️ Scraper returned no results, using mock fallback data...");
    entries = await client.getMockSpiData();
  }

  for (const entry of entries) {
    // Save Sale Price as an indicator
    await prisma.economicIndicator.create({
      data: {
        name: `SPI Sale Price: ${entry.area}`,
        category: "real-estate:spi:sale",
        value: entry.priceSale || 0,
        unit: "€/sqm",
        period: entry.period,
        source: "Spitogatos",
        metadata: {
          region: entry.area,
          type: "SALE",
          changeYearly: entry.changeSale
        },
      }
    });

    // Save Rent Price as an indicator
    if (entry.priceRent) {
      await prisma.economicIndicator.create({
        data: {
          name: `SPI Rent Price: ${entry.area}`,
          category: "real-estate:spi:rent",
          value: entry.priceRent,
          unit: "€/sqm",
          period: entry.period,
          source: "Spitogatos",
          metadata: {
            region: entry.area,
            type: "RENT",
            changeYearly: entry.changeRent
          },
        }
      });
    }
  }
  console.log(`✅ Synced ${entries.length} SPI area entries.`);
}


async function main() {
  try {
    await syncMetadata();
    await syncRecentDecisions();
    await syncEconomicIndicators();
    await syncSpiData();
    console.log("🏁 Sync completed successfully!");
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
