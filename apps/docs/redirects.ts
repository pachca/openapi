type Redirect = {
  source: string;
  destination: string;
};

const redirects: Redirect[] = [
  // { source: '/old-page', destination: '/new-section/new-page' },
  // { source: '/old-section/:path*', destination: '/new-section/:path*' },
];

export default redirects;
