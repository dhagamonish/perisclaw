import { AstraIntent } from './ai.js';

class GlobalState {
  private activeSock: any = null;
  private pendingActions: Map<string, AstraIntent> = new Map();

  setSock(sock: any) {
    this.activeSock = sock;
  }

  getSock() {
    return this.activeSock;
  }

  setPendingAction(jid: string, intent: AstraIntent) {
    this.pendingActions.set(jid, intent);
  }

  getPendingAction(jid: string) {
    return this.pendingActions.get(jid);
  }

  clearPendingAction(jid: string) {
    this.pendingActions.delete(jid);
  }
}

export const state = new GlobalState();

// Compatibility exports for existing code
export const setPendingAction = (jid: string, intent: AstraIntent) => state.setPendingAction(jid, intent);
export const getPendingAction = (jid: string) => state.getPendingAction(jid);
export const clearPendingAction = (jid: string) => state.clearPendingAction(jid);
