import { loadSchema } from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";
import fetch from "cross-fetch";

export async function createRemoteSchema() {
  // Executable schema ready to be stitched
  return loadSchema(
    "https://rickandmortyapi.com/graphql",
    {
      loaders: [new UrlLoader()],
      fetch,
    }
  )
}
