import { NextResponse } from "next/server";
import { AUTH_REQUIRED_ERROR } from "@/lib/auth";
import {
  CAPABILITY_FORBIDDEN_ERROR,
  CapabilityForbiddenError,
} from "@/lib/capabilities";

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof CapabilityForbiddenError) {
    return NextResponse.json(
      {
        error: CAPABILITY_FORBIDDEN_ERROR,
        capability: error.capability,
      },
      { status: 403 }
    );
  }

  if (error instanceof Error && error.message !== AUTH_REQUIRED_ERROR) {
    console.error("Unexpected authorization error:", error);
  }

  return NextResponse.json({ error: AUTH_REQUIRED_ERROR }, { status: 401 });
}
