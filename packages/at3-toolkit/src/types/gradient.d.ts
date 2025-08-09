// Type definitions for gradient-string utilities
export type GradientFunction = (text: string) => string;

export interface GradientUtils {
  ait3e: GradientFunction;
  primary: GradientFunction;
  success: GradientFunction;
  rainbow: GradientFunction;
  morning: GradientFunction;
  atlas: GradientFunction;
}
