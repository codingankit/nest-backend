export const CORS = (clientUrl: string) => {
  return {
    origin: [clientUrl],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowed_headers: ['Content-Type', 'Authorization'],
    exposed_headers: ['Set-Cookie'],
    credentials: true,
  };
};
