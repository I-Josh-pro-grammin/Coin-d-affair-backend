import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Coin d'affaire",
      version: "1.0.0",
      description: "Coin d'affaire API documentation",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },

  // Path to your route files (where you'll write annotations)
  apis: ["./src/route/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;