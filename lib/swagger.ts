import swaggerJSDoc from "swagger-jsdoc"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cultural Sites of Chemnitz API",
      version: "1.0.0",
      description: "API for accessing cultural landmarks and sites in Chemnitz from OpenStreetMap data",
      contact: {
        name: "Cultural Explorer Team",
        email: "contact@cultural-explorer.com",
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        CulturalSite: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier",
            },
            osmId: {
              type: "string",
              description: "OpenStreetMap ID",
            },
            name: {
              type: "string",
              description: "Name of the cultural site",
            },
            category: {
              type: "string",
              enum: ["Theatre", "Museum", "Art", "Tourism Spots", "Monument", "Gallery", "Library"],
              description: "Category of the cultural site",
            },
            description: {
              type: "string",
              description: "Description of the site",
            },
            address: {
              type: "string",
              description: "Street address",
            },
            coordinates: {
              type: "object",
              properties: {
                lat: {
                  type: "number",
                  description: "Latitude",
                },
                lng: {
                  type: "number",
                  description: "Longitude",
                },
              },
            },
            tags: {
              type: "object",
              description: "OpenStreetMap tags",
            },
            website: {
              type: "string",
              description: "Official website URL",
            },
            phone: {
              type: "string",
              description: "Contact phone number",
            },
            openingHours: {
              type: "string",
              description: "Opening hours information",
            },
            accessibility: {
              type: "object",
              properties: {
                wheelchair: {
                  type: "string",
                  enum: ["yes", "no", "limited"],
                },
                parking: {
                  type: "boolean",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            code: {
              type: "string",
              description: "Error code",
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/CulturalSite",
              },
            },
            pagination: {
              type: "object",
              properties: {
                page: {
                  type: "number",
                },
                limit: {
                  type: "number",
                },
                total: {
                  type: "number",
                },
                totalPages: {
                  type: "number",
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./app/api/**/*.ts"], // Path to the API files
}

const swaggerSpec = swaggerJSDoc(options)

export default swaggerSpec
