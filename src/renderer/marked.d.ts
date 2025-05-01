declare module 'marked' {
  export function marked(text: string, options?: any): string;
  export namespace marked {
    function parse(text: string, options?: any): string;
  }
}