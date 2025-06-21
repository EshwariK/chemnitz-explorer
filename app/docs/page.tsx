"use client"

import { useEffect, useState } from "react"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => setSpec(data))
  }, [])

  if (!spec) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground">Comprehensive documentation for the Cultural Sites of Chemnitz API</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm">
        <SwaggerUI url="/swagger.json" />
      </div>
    </div>
  )
}
