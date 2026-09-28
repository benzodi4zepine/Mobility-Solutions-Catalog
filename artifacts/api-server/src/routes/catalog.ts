import { Router, type IRouter } from "express";
import {
  allSolutions,
  catalogCategory,
  catalogOverview,
  clinicLocations,
} from "@workspace/catalog";
import {
  GetCatalogCategoryResponse,
  GetCatalogOverviewResponse,
  GetLocationsResponse,
  GetSolutionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/catalog/overview", (_req, res) => {
  res.json(GetCatalogOverviewResponse.parse(catalogOverview()));
});

router.get("/catalog/categories/:slug", (req, res) => {
  const category = catalogCategory(req.params.slug);

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(GetCatalogCategoryResponse.parse(category));
});

router.get("/catalog/solutions", (_req, res) => {
  res.json(GetSolutionsResponse.parse(allSolutions()));
});

router.get("/locations", (_req, res) => {
  res.json(GetLocationsResponse.parse(clinicLocations()));
});

export default router;
