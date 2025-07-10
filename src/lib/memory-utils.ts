/**
 * Memory monitoring utilities for debugging memory leaks
 * Use only in development environment
 */

// Extend Performance interface to include memory property
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  interface Window {
    webkitAudioContext?: typeof AudioContext;
    __memoryMonitor?: MemoryMonitor;
  }
}

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  domNodes: number;
}

type AudioContextConstructor = typeof AudioContext;

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private isMonitoring = false;
  private intervalId?: NodeJS.Timeout;
  private readonly maxSnapshots = 100;

  constructor() {
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      this.setupGlobalMonitoring();
    }
  }

  private setupGlobalMonitoring() {
    // Monitor for common memory leak patterns
    this.monitorAudioContexts();
    this.monitorWebRTCConnections();
    this.monitorEventListeners();
  }

  private monitorAudioContexts() {
    let activeContexts = 0;
    const originalAudioContext: AudioContextConstructor =
      window.AudioContext || window.webkitAudioContext;

    if (!originalAudioContext) return;

    function MonitoredAudioContext(
      this: AudioContext,
      contextOptions?: AudioContextOptions
    ): AudioContext {
      const context = new originalAudioContext(contextOptions);
      activeContexts++;
      console.log(`🎵 AudioContext created (active: ${activeContexts})`);

      const originalClose = context.close.bind(context);
      context.close = function () {
        activeContexts--;
        console.log(`🎵 AudioContext closed (active: ${activeContexts})`);
        return originalClose();
      };

      return context;
    }

    // Copy prototype and static methods
    MonitoredAudioContext.prototype = originalAudioContext.prototype;
    Object.setPrototypeOf(MonitoredAudioContext, originalAudioContext);

    window.AudioContext =
      MonitoredAudioContext as unknown as AudioContextConstructor;
    if (window.webkitAudioContext) {
      window.webkitAudioContext =
        MonitoredAudioContext as unknown as AudioContextConstructor;
    }
  }

  private monitorWebRTCConnections() {
    const originalRTCPeerConnection = window.RTCPeerConnection;
    if (!originalRTCPeerConnection) return;

    let activeConnections = 0;

    // Create a proper constructor function
    function MonitoredRTCPeerConnection(
      this: RTCPeerConnection,
      configuration?: RTCConfiguration
    ): RTCPeerConnection {
      const pc = new originalRTCPeerConnection(configuration);
      activeConnections++;
      console.log(
        `🌐 RTCPeerConnection created (active: ${activeConnections})`
      );

      const originalClose = pc.close.bind(pc);
      pc.close = function () {
        activeConnections--;
        console.log(
          `🌐 RTCPeerConnection closed (active: ${activeConnections})`
        );
        return originalClose();
      };

      return pc;
    }

    // Copy static methods and prototype
    Object.setPrototypeOf(
      MonitoredRTCPeerConnection,
      originalRTCPeerConnection
    );
    Object.defineProperty(MonitoredRTCPeerConnection, "prototype", {
      value: originalRTCPeerConnection.prototype,
      writable: false,
    });

    // Copy static methods
    MonitoredRTCPeerConnection.generateCertificate =
      originalRTCPeerConnection.generateCertificate;

    window.RTCPeerConnection =
      MonitoredRTCPeerConnection as unknown as typeof RTCPeerConnection;
  }

  private monitorEventListeners() {
    if (typeof window === "undefined" || typeof Element === "undefined") return;

    const originalAddEventListener = Element.prototype.addEventListener;
    const originalRemoveEventListener = Element.prototype.removeEventListener;
    const listenerMap = new WeakMap<Element, Set<string>>();

    Element.prototype.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      if (!listenerMap.has(this)) {
        listenerMap.set(this, new Set());
      }

      const listeners = listenerMap.get(this)!;
      const listenerName =
        typeof listener === "function"
          ? listener.name || "anonymous"
          : "object";
      listeners.add(`${type}:${listenerName}`);

      return originalAddEventListener.call(this, type, listener, options);
    };

    Element.prototype.removeEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ) {
      if (listenerMap.has(this)) {
        const listeners = listenerMap.get(this)!;
        const listenerName =
          typeof listener === "function"
            ? listener.name || "anonymous"
            : "object";
        listeners.delete(`${type}:${listenerName}`);
      }

      return originalRemoveEventListener.call(this, type, listener, options);
    };

    // Periodic check for elements with many listeners
    setInterval(() => {
      if (
        process.env.NODE_ENV === "development" &&
        typeof document !== "undefined"
      ) {
        const elements = document.querySelectorAll("*");
        elements.forEach((element) => {
          if (listenerMap.has(element)) {
            const listeners = listenerMap.get(element)!;
            if (listeners.size > 10) {
              console.warn(
                `🎧 Element has ${listeners.size} event listeners:`,
                element,
                listeners
              );
            }
          }
        });
      }
    }, 30000); // Check every 30 seconds
  }

  public startMonitoring(intervalMs = 5000) {
    if (this.isMonitoring || typeof window === "undefined") return;

    this.isMonitoring = true;
    console.log("🔍 Memory monitoring started");

    this.intervalId = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    this.takeSnapshot(); // Initial snapshot
  }

  public stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log("🔍 Memory monitoring stopped");
  }

  private takeSnapshot(): MemorySnapshot | null {
    if (typeof window === "undefined" || !performance.memory) {
      // console.warn("Performance memory API not available");
      return null;
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      domNodes: document.getElementsByTagName("*").length,
    };

    this.snapshots.push(snapshot);

    // Keep only the last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    this.analyzeMemoryTrend();
    return snapshot;
  }

  private analyzeMemoryTrend() {
    if (this.snapshots.length < 5) return;

    const recent = this.snapshots.slice(-5);
    const memoryGrowth =
      recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const growthRate = memoryGrowth / timeSpan; // bytes per ms

    // Alert if memory is growing rapidly (more than 1MB per minute)
    if (growthRate > (1024 * 1024) / (60 * 1000)) {
      console.warn("⚠️ Rapid memory growth detected!", {
        growthMB: Math.round(memoryGrowth / 1024 / 1024),
        timeMinutes: Math.round(timeSpan / 1000 / 60),
        ratePerMinute: `${Math.round((growthRate * 60 * 1000) / 1024 / 1024)} MB/min`,
      });
    }
  }

  public getMemoryReport() {
    if (this.snapshots.length === 0) {
      return { error: "No snapshots available" };
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const oldest = this.snapshots[0];

    return {
      current: {
        usedMB: Math.round(latest.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(latest.totalJSHeapSize / 1024 / 1024),
        limitMB: Math.round(latest.jsHeapSizeLimit / 1024 / 1024),
        domNodes: latest.domNodes,
      },
      trend: {
        memoryGrowthMB: Math.round(
          (latest.usedJSHeapSize - oldest.usedJSHeapSize) / 1024 / 1024
        ),
        domNodeGrowth: latest.domNodes - oldest.domNodes,
        timeSpanMinutes: Math.round(
          (latest.timestamp - oldest.timestamp) / 1000 / 60
        ),
      },
      snapshots: this.snapshots.length,
    };
  }

  public logReport() {
    const report = this.getMemoryReport();
    console.table(report);
  }
}

// Global instance for development (browser only)
const memoryMonitor =
  typeof window !== "undefined" ? new MemoryMonitor() : null;

// Auto-start monitoring in development (browser only)
if (
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  memoryMonitor
) {
  setTimeout(() => {
    memoryMonitor.startMonitoring();
  }, 2000);
}

// Expose for manual control
if (typeof window !== "undefined" && memoryMonitor) {
  window.__memoryMonitor = memoryMonitor;
}

export { memoryMonitor, MemoryMonitor };
export type { MemorySnapshot };
