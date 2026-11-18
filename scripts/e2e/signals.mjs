// Keep listeners installed until exit: repeated Ctrl-C must not skip owned cleanup.
/** @param {{ cleanup: () => Promise<unknown>, onInterrupt: (signal: string) => void, source?: Pick<import('node:events').EventEmitter, 'on' | 'removeListener'>, exit?: (code: number) => void }} options */
export function installSignalCleanup({ cleanup, onInterrupt, source = process, exit = (code) => process.exit(code) }) {
  let stopping = false;
  const handler = (signal) => {
    if (stopping) return;
    stopping = true;
    onInterrupt(signal);
    void Promise.resolve().then(cleanup).then(
      () => exit(130),
      (error) => { console.error('Owned process cleanup failed:', error); exit(1); },
    );
  };
  const listeners = ['SIGINT', 'SIGTERM'].map((signal) => {
    const listener = () => handler(signal);
    source.on(signal, listener);
    return [signal, listener];
  });
  return () => { for (const [signal, listener] of listeners) source.removeListener(signal, listener); };
}
