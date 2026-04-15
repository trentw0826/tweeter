#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-tweeter-server}"
AWS_REGION="${AWS_REGION:-us-east-1}"

PROFILE_ARGS=()
if [[ -n "${AWS_PROFILE:-}" ]]; then
  PROFILE_ARGS+=(--profile "$AWS_PROFILE")
fi

BUCKET_NAME=$(aws cloudformation describe-stack-resources \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  "${PROFILE_ARGS[@]}" \
  --query "StackResources[?LogicalResourceId=='mediaBucket'].PhysicalResourceId | [0]" \
  --output text)

if [[ -z "$BUCKET_NAME" || "$BUCKET_NAME" == "None" ]]; then
  echo "Could not resolve mediaBucket from stack '$STACK_NAME' in region '$AWS_REGION'." >&2
  exit 1
fi

echo "Using BUCKET_NAME=$BUCKET_NAME"
BUCKET_NAME="$BUCKET_NAME" npm run test:integration
