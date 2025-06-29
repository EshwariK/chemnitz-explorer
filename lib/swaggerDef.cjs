module.exports = {
  openapi: "3.0.0",
    info: {
      title: "WhereWeAre API",
      version: "1.0.0",
      description:
        "Comprehensive API for accessing cultural landmarks, user management, memories, and favorites in Chemnitz",
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || "http://localhost:3000",
        description: "Application server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
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
        Memory: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Unique identifier",
            },
            userId: {
              type: "string",
              description: "User who created the memory",
            },
            siteId: {
              type: "string",
              description: "Associated cultural site ID",
            },
            siteName: {
              type: "string",
              description: "Name of the cultural site",
            },
            siteCategory: {
              type: "string",
              description: "Category of the cultural site",
            },
            coordinates: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            title: {
              type: "string",
              description: "Optional title for the memory",
            },
            note: {
              type: "string",
              description: "Memory description/note",
            },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  filename: { type: "string" },
                  originalName: { type: "string" },
                  mimeType: { type: "string" },
                  size: { type: "number" },
                },
              },
            },
            tags: {
              type: "array",
              items: { type: "string" },
            },
            isPublic: {
              type: "boolean",
              description: "Whether the memory is publicly visible",
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
        UserProfile: {
          type: "object",
          properties: {
            userId: { type: "string" },
            displayName: { type: "string" },
            bio: { type: "string" },
            interests: {
              type: "array",
              items: { type: "string" },
            },
            location: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
                address: { type: "string" },
              },
            },
            preferences: {
              type: "object",
              properties: {
                theme: { type: "string", enum: ["light", "dark", "system"] },
                language: { type: "string" },
                notifications: { type: "boolean" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Favorite: {
          type: "object",
          properties: {
            siteId: { type: "string" },
            siteName: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            coordinates: {
              type: "object",
              properties: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
            addedAt: { type: "string", format: "date-time" },
          },
        },
        Activity: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["visit", "favorite", "memory", "search"],
            },
            siteId: { type: "string" },
            siteName: { type: "string" },
            category: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
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
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Cultural Sites",
        description: "Operations related to cultural sites and landmarks",
      },
      {
        name: "User Management",
        description: "User profile, preferences, and account operations",
      },
      {
        name: "Memories",
        description: "User-generated memories with photos and notes",
      },
      {
        name: "Favorites",
        description: "User favorite sites management",
      },
      {
        name: "Activities",
        description: "User activity tracking and history",
      },
      {
        name: "Authentication",
        description: "Authentication and session management",
      },
    ],
};