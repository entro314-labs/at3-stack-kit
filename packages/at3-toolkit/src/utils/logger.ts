export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  setVerbose(verbose: boolean) {
    this.verbose = verbose;
  }

  info(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log("[INFO]", message, ...args);
    }
  }

  success(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log("[SUCCESS]", message, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log("[WARNING]", message, ...args);
    }
  }

  error(message: string, error?: any) {
    console.error("[ERROR]", message);
    if (error && this.verbose) {
      if (error instanceof Error) {
        console.error(error.stack);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.verbose) {
      console.log("[DEBUG]", message, ...args);
    }
  }

  table(data: Record<string, string>) {
    if (this.verbose) {
      console.log();
      Object.entries(data).forEach(([key, value]) => {
        console.log(`${key.padEnd(20)} ${value}`);
      });
      console.log();
    }
  }

  list(items: string[], prefix: string = "•") {
    if (this.verbose) {
      items.forEach((item) => {
        console.log(`  ${prefix} ${item}`);
      });
    }
  }

  step(step: number, total: number, message: string) {
    if (this.verbose) {
      console.log(`[${step}/${total}] ${message}`);
    }
  }

  section(title: string) {
    if (this.verbose) {
      console.log(`\n${title}`);
      console.log("=".repeat(title.length));
    }
  }

  newline() {
    if (this.verbose) {
      console.log();
    }
  }

  spinner(message: string) {
    // Simple spinner implementation for the logger
    if (this.verbose) {
      console.log(`⏳ ${message}`);
    }

    return {
      succeed: (msg?: string) => {
        if (this.verbose) {
          console.log(`✅ ${msg || message}`);
        }
      },
      fail: (msg?: string) => {
        if (this.verbose) {
          console.log(`❌ ${msg || message}`);
        }
      },
      stop: (msg?: string) => {
        if (this.verbose && msg) {
          console.log(`⏸️  ${msg}`);
        }
      },
    };
  }
}
