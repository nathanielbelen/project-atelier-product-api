// require('dotenv').config();
// disabled, using docker .env!

const express = require('express');
const app = express();
const db = require('./db');
const port = process.env.PORT || 3000;

app.get('/products', (req, res) => {
  let page = req.query.page || '1';
  let count = req.query.count || '5';
  let offset = (Number(page) - 1) * Number(count);
  db.query(
    'SELECT id, name, slogan, description, category, default_price FROM products LIMIT $1 OFFSET $2',
    [count, offset.toString()],
    (err, response) => {
      if (err) {
        console.log(err.stack);
      }
      if (response) {
        res.send(response.rows);
      } else {
        res.status(400).end();
      }
    }
  );
});

app.get('/products/:product_id', (req, res) => {
  db.query(
    `
  SELECT products.id, products.name, products.slogan, products.description, products.category, products.default_price, (array(
    SELECT json_agg(t)
    FROM (
      SELECT features.feature, features.value
      FROM features
      WHERE features.product_id = products.id
    ) t
  )) AS features
  FROM products
  WHERE products.id = $1;`,
    [req.params.product_id],
    (err, response) => {
      if (err) {
        console.log(err.stack);
      }
      if (response) {
        res.send(response.rows[0]);
      } else {
        res.status(400).end();
      }
    }
  );
});

app.get('/products/:product_id/styles', (req, res) => {
  db.query(
    `
    SELECT id AS style_id, name, original_price, sale_price, default_style as "default?",
    (SELECT json_agg(
      json_build_object('url', url, 'thumbnail_url', thumbnail_url)) AS photos
        FROM photos
          WHERE styleId = st.id),
    (SELECT json_object_agg("id", json_build_object('quantity', quantity, 'size', size)) AS skus
      FROM skus
        WHERE styleId = st.id)
    FROM styles st
    WHERE st.productId = $1
  `,
    [req.params.product_id],
    (err, response) => {
      if (err) {
        console.log(err.stack);
      }
      if (response) {
        res.send(response.rows[0]);
      } else {
        res.status(400).end();
      }
    }
  );
});

app.get('/products/:product_id/related', (req, res) => {
  db.query(
    `
    SELECT array_agg(related.related_product_id) AS related
    FROM related
    WHERE related.current_product_id = $1;
  `,
    [req.params.product_id],
    (err, response) => {
      if (err) {
        console.log(err.stack);
      }
      if (response) {
        res.send(response.rows[0].related);
      } else {
        res.status(400).end();
      }
    }
  );
});

app.listen(port, () => {
  console.log(
    `listening on port ${port}`
  );
});

/*
old styles query

`SELECT p.id AS product_id,
  (SELECT json_agg(t2) FROM
    (SELECT styles.id AS style_id, styles.name,
      styles.original_price, styles.sale_price,
      styles.default_style AS "default\?",
      (SELECT json_agg(t3) FROM
        (SELECT photos.thumbnail_url, photos.url
        FROM photos where photos.styleId = styles.id
        AND styles.productId = p.id
        ) AS t3
      ) AS photos,
      (SELECT jsonb_object_agg(id, key_pair) FROM
        (SELECT
          skus.id,
          (SELECT json_build_object
            ('size', skus.size, 'quantity', skus.quantity)
          ) key_pair
          FROM skus INNER JOIN styles
          ON styles.id = skus.styleId
          WHERE skus.styleId = styles.id
          AND styles.productId = p.id GROUP BY skus.id
        ) AS asdf) AS skus FROM styles WHERE productId = p.id
    ) AS t2
  ) AS results
  FROM products AS p WHERE p.id = $1;`

*/
