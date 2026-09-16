import { NextResponse } from "next/server"

export class ApiResponse {
  static BadRequest(message?: string, data?: unknown) {
    return NextResponse.json(
      {
        code: 400,
        success: false,
        message: message,
        data,
      },
      {
        status: 400,
      }
    )
  }

  static Unauthorized(message?: string, data?: unknown) {
    return NextResponse.json(
      {
        code: 401,
        success: false,
        message: message,
        data,
      },
      {
        status: 401,
      }
    )
  }

  static NotFound(message?: string, data?: unknown) {
    return NextResponse.json(
      {
        code: 404,
        success: false,
        message: message,
        data,
      },
      {
        status: 404,
      }
    )
  }

  static InternalServerError(message?: string, data?: unknown) {
    return NextResponse.json(
      {
        code: 500,
        success: false,
        message: message,
        data,
      },
      {
        status: 500,
      }
    )
  }

  static Success(message?: string, data?: unknown) {
    return NextResponse.json(
      {
        code: 200,
        success: true,
        message: message,
        data,
      },
      {
        status: 200,
      }
    )
  }

  static Forbidden(message?: string, data?: unknown) {
    return NextResponse.json(
      {
        code: 403,
        success: false,
        message: message,
        data,
      },
      {
        status: 403,
      }
    )
  }
}
