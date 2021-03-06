import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  InsecureSkipTLSVerify: true,
  noConnectionReuse: true,
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '10s', target: 1000 },
    { duration: '3m', target: 1000 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  const BASE_URL = 'http://localhost:1337'; // make sure this is not production
  const id = (Math.floor(Math.random() * 100000)) + 900000;

  const responses = http.batch([
    ['GET', `${BASE_URL}/products/${id}`, null, { tags: { name: 'Product' } }],
    ['GET', `${BASE_URL}/products/${id}/styles`, null, { tags: { name: 'Styles' } }],
    ['GET', `${BASE_URL}/products/${id}/related`, null, { tags: { name: 'Related' } }],
  ]);

  sleep(0.1);
}



