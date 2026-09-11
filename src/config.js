import Conf from 'conf';

const schema = {
  endpoint: {
    type: 'string',
    default: 'http://localhost:3000'
  },
  token: {
    type: ['string', 'null'],
    default: null
  },
  activeSessionId: {
    type: ['string', 'null'],
    default: null
  }
};

export const configStore = new Conf({
  projectName: 'buggraph',
  configName: 'config',
  schema
});

export function getConfig() {
  const envEndpoint = process.env.BUGGRAPH_API_URL;
  const envToken = process.env.BUGGRAPH_TOKEN;

  return {
    endpoint: envEndpoint || configStore.get('endpoint') || 'http://localhost:3000',
    token: envToken || configStore.get('token'),
    activeSessionId: configStore.get('activeSessionId')
  };
}

export function setToken(token) {
  configStore.set('token', token);
}

export function setEndpoint(endpoint) {
  configStore.set('endpoint', endpoint);
}

export function setActiveSessionId(sessionId) {
  configStore.set('activeSessionId', sessionId);
}

export function clearConfig() {
  configStore.clear();
}
