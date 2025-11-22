import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Coin d'affaire API",
      version: "1.0.0",
      description: "Full API documentation for Coin d'affaire marketplace",
    },

    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local server",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },

      schemas: {
        Business: {
          type: "object",
          properties: {
            business_name: { type: "string", example: "Tech Hub Ltd" },
            vat_number: { type: "string", example: "VAT-12345" },
            subscription_plan: { type: "string", example: "premium" },
            is_paid: { type: "boolean", example: true }
          }
        },

        Product: {
          type: "object",
          properties: {
            categoryId: { type: "integer", example: 3 },
            subcategoryId: { type: "integer", example: 8 },
            title: { type: "string", example: "iPhone 14 Pro" },
            description: { type: "string", example: "256GB - New - Factory Unlocked" },
            price: { type: "number", example: 899.99 },
            currency: { type: "string", example: "USD" },
            condition: { type: "string", example: "new" },
            isNegotiable: { type: "boolean", example: false },
            canDeliver: { type: "boolean", example: true },
            stock: { type: "integer", example: 12 },
            attributes: {
              type: "object",
              example: {
                color: "Deep Purple",
                storage: "256GB"
              }
            },
            locationId: { type: "integer", example: 4 }
          }
        }
      }
    },
  },

  apis: ["./src/route/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
