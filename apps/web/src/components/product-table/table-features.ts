import { tableFeatures } from "@tanstack/react-table";

// No optional features needed: pagination is handled entirely server-side
// (we render exactly the one page of rows the API returned), so only the
// automatic core row model is required.
export const tableFeatureSet = tableFeatures({});
