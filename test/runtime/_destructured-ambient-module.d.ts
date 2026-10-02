export interface Client {
  name: string
}

export function initializeClient(service: string, options?: { user?: string }): Promise<Client>
