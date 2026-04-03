#!/bin/sh
set -eu

ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localstack:4566}"
REGION="${AWS_REGION:-us-east-1}"
STAGE="${API_STAGE_NAME:-local}"
ACCOUNT_ID="${LOCALSTACK_ACCOUNT_ID:-000000000000}"

USERS_TABLE="tweeter-users-${STAGE}"
AUTH_TOKENS_TABLE="tweeter-auth-tokens-${STAGE}"
FOLLOWS_TABLE="tweeter-follows-${STAGE}"
STORY_TABLE="tweeter-story-${STAGE}"
FEED_TABLE="tweeter-feed-${STAGE}"
BUCKET_NAME="tweeter-media-${STAGE}-${ACCOUNT_ID}"

echo "Waiting for LocalStack at ${ENDPOINT}..."
until aws --endpoint-url "${ENDPOINT}" --region "${REGION}" sts get-caller-identity >/dev/null 2>&1; do
  sleep 1
done

create_table_if_missing() {
  table_name="$1"
  shift

  if aws --endpoint-url "${ENDPOINT}" --region "${REGION}" dynamodb describe-table --table-name "${table_name}" >/dev/null 2>&1; then
    echo "Table exists: ${table_name}"
    return
  fi

  echo "Creating table: ${table_name}"
  aws --endpoint-url "${ENDPOINT}" --region "${REGION}" dynamodb create-table "$@"
}

create_table_if_missing "${USERS_TABLE}" \
  --table-name "${USERS_TABLE}" \
  --attribute-definitions AttributeName=alias,AttributeType=S \
  --key-schema AttributeName=alias,KeyType=HASH \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1

create_table_if_missing "${AUTH_TOKENS_TABLE}" \
  --table-name "${AUTH_TOKENS_TABLE}" \
  --attribute-definitions AttributeName=token,AttributeType=S \
  --key-schema AttributeName=token,KeyType=HASH \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1

create_table_if_missing "${FOLLOWS_TABLE}" \
  --table-name "${FOLLOWS_TABLE}" \
  --attribute-definitions AttributeName=followerAlias,AttributeType=S AttributeName=followeeAlias,AttributeType=S \
  --key-schema AttributeName=followerAlias,KeyType=HASH AttributeName=followeeAlias,KeyType=RANGE \
  --global-secondary-indexes "IndexName=FolloweeIndex,KeySchema=[{AttributeName=followeeAlias,KeyType=HASH},{AttributeName=followerAlias,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=1,WriteCapacityUnits=1}" \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1

create_table_if_missing "${STORY_TABLE}" \
  --table-name "${STORY_TABLE}" \
  --attribute-definitions AttributeName=userAlias,AttributeType=S AttributeName=timestamp,AttributeType=N \
  --key-schema AttributeName=userAlias,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1

create_table_if_missing "${FEED_TABLE}" \
  --table-name "${FEED_TABLE}" \
  --attribute-definitions AttributeName=ownerAlias,AttributeType=S AttributeName=timestamp,AttributeType=N \
  --key-schema AttributeName=ownerAlias,KeyType=HASH AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1

if aws --endpoint-url "${ENDPOINT}" --region "${REGION}" s3api head-bucket --bucket "${BUCKET_NAME}" >/dev/null 2>&1; then
  echo "Bucket exists: ${BUCKET_NAME}"
else
  echo "Creating bucket: ${BUCKET_NAME}"
  aws --endpoint-url "${ENDPOINT}" --region "${REGION}" s3api create-bucket --bucket "${BUCKET_NAME}"
fi

cat <<EOF >/tmp/public-read-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET_NAME}/*"]
    }
  ]
}
EOF

aws --endpoint-url "${ENDPOINT}" --region "${REGION}" s3api put-bucket-policy \
  --bucket "${BUCKET_NAME}" \
  --policy file:///tmp/public-read-policy.json

echo "LocalStack bootstrap complete."
