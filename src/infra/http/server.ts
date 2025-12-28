import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { DiavgeiaClient } from "../api/diavgeia.client";
import { DiavgeiaDecisionRepository } from "../repositories/diavgeia-decision.repository";
import { SearchDecisionsUseCase } from "../../core/use-cases/search-decisions";
import { DiavgeiaMetadataRepository } from "../repositories/diavgeia-metadata.repository";
import { GetMetadataUseCase } from "../../core/use-cases/get-metadata";
import { DecisionController } from "./controllers/decision.controller";
import { MetadataController } from "./controllers/metadata.controller";
import { InsightController } from "./controllers/insight.controller";
import { ValuationController } from "./controllers/valuation.controller";
import { GemiClient } from "../api/gemi.client";
import { BogClient } from "../api/bog.client";
import { PrismaCompanyRepository } from "../repositories/prisma-company.repository";
import { PrismaEconomicIndicatorRepository } from "../repositories/prisma-economic-indicator.repository";
import { GetCompanyExtendedInfo } from "../../core/use-cases/get-company-extended-info";

// Dependency Injection
const diavgeiaClient = new DiavgeiaClient();
const gemiClient = new GemiClient();
const bogClient = new BogClient();

const decisionRepository = new DiavgeiaDecisionRepository(diavgeiaClient);
const searchDecisionsUseCase = new SearchDecisionsUseCase(decisionRepository);
const decisionController = new DecisionController(searchDecisionsUseCase);

const metadataRepository = new DiavgeiaMetadataRepository(diavgeiaClient);
const getMetadataUseCase = new GetMetadataUseCase(metadataRepository);
const metadataController = new MetadataController(getMetadataUseCase);

const companyRepository = new PrismaCompanyRepository();
const getCompanyInfoUseCase = new GetCompanyExtendedInfo(companyRepository, gemiClient);
const insightController = new InsightController(getCompanyInfoUseCase);
const valuationController = new ValuationController();

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get("/", () => ({ status: "Diorasis API is running" }))
  .group("/api/v1", (app) =>
    app
      .group("/decisions", (app) =>
        app.get("/", ({ query }) => decisionController.searchDecisions(query), {
          query: t.Object({
            q: t.Optional(t.String()),
            page: t.Optional(t.String()),
            size: t.Optional(t.String()),
            org: t.Optional(t.String()),
            type: t.Optional(t.String()),
            from: t.Optional(t.String()),
            to: t.Optional(t.String()),
            order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
          }),
        })
      )
      .group("/metadata", (app) =>
        app
          .get("/types", () => metadataController.getDecisionTypes())
          .get("/organizations", ({ query }) => metadataController.searchOrganizations(query), {
            query: t.Object({
              q: t.Optional(t.String()),
            }),
          })
      )
      .group("/insights", (app) =>
        app.get("/economic-context", () => insightController.getEconomicContext())
      )
      .group("/company", (app) =>
        app.get("/:vat", ({ params }) => insightController.getCompanyInsights(params.vat))
      )
      .group("/valuation", (app) =>
        app.get("/estimate", ({ query }) => valuationController.estimateValuation(query as any), {
          query: t.Object({
            region: t.String(),
            age: t.Optional(t.String()),
            size: t.Optional(t.String()),
          }),
        })
      )
  )
  .listen(3001);

console.log(`🚀 Server is running at http://${app.server?.hostname}:${app.server?.port}`);
console.log(`📖 Swagger documentation at http://${app.server?.hostname}:${app.server?.port}/swagger`);
