// Elasticsearch client configuration for search functionality
const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: 'http://localhost:9200'
});

module.exports = esClient;
