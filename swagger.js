const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0", // OpenAPI version
    info: {
      title: "Booking API",
      version: "1.0.0",
      description: "API documentation for booking and payments",
    },
    servers: [
      {
        url: "http://localhost:3000", // Your API base URL
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to your route files where you'll add Swagger comments
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };
