let fallbackIdCounter=0;

export function createId(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  fallbackIdCounter+=1;
  return `local-${Date.now().toString(36)}-${fallbackIdCounter.toString(36)}-${Math.random().toString(36).slice(2)}`;
}
