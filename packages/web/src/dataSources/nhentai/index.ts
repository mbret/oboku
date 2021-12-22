import { dataSourcePlugins } from "@oboku/shared";
import { ObokuDataSourcePlugin } from "../types";
import { UploadComponent } from "./UploadComponent";

export const plugin: ObokuDataSourcePlugin = {
  ...dataSourcePlugins.NHENTAI,
  UploadComponent,
}