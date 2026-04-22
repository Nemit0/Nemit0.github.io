import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dooray-ai-chat": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          token?: string;
          domain?: string;
          allow?: string;
        },
        HTMLElement
      >;
    }
  }
}
