export interface SessionAction {
  id: string;
  label: string;
  type: 'GMAIL' | 'CALENDAR' | 'REMINDER' | 'CANCEL';
  data: any;
  summary: string;
}

class GlobalState {
  private sock: any = null;
  // Map of User JID -> List of currently active menu options
  private sessions: Map<string, SessionAction[]> = new Map();

  setSock(s: any) {
    this.sock = s;
  }

  getSock() {
    return this.sock;
  }

  setSession(jid: string, actions: SessionAction[]) {
    this.sessions.set(jid, actions);
  }

  getSession(jid: string): SessionAction[] | undefined {
    return this.sessions.get(jid);
  }

  clearSession(jid: string) {
    this.sessions.delete(jid);
  }

  // Legacy compatibility methods (mapped to sessions)
  getPendingAction(jid: string) {
    const session = this.getSession(jid);
    return session ? session[0] : null;
  }

  setPendingAction(jid: string, action: any) {
    this.setSession(jid, [{ 
      id: '1', 
      label: 'Confirm', 
      type: action.type, 
      data: action.data, 
      summary: action.summary 
    }]);
  }

  clearPendingAction(jid: string) {
    this.clearSession(jid);
  }
}

export const state = new GlobalState();
