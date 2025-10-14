// Polyfill for Promise.withResolvers for Node versions where it's not available
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
// Matrix SDK may rely on this API in newer versions.
// This polyfill ensures compatibility on Node < 22.
/* eslint-disable */

declare global {
  interface PromiseConstructor {
    // ts-ignore: Promise.withResolvers is not available in Node < 22
    // @ts-ignore
    withResolvers?: <T = unknown>() => {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    };
  }
}

if (typeof Promise.withResolvers !== 'function') {
  (Promise as any).withResolvers = function <T = unknown>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export {}; // ensure this file is treated as a module
