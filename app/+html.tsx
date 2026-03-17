import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// This file is the HTML shell for all web pages in the app.
// https://docs.expo.dev/router/reference/static-rendering/#root-html
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover lets useSafeAreaInsets() read iPhone notch height */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
