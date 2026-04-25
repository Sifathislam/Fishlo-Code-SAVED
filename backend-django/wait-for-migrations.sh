#!/bin/sh
# wait-for-migrations.sh

set -e

host="$1"
shift
cmd="$@"

echo "Waiting for database to be ready..."
until python manage.py migrate --check 2>&1 | grep -q "No changes detected"; do
  >&2 echo "Migrations not complete - waiting..."
  sleep 2
done

>&2 echo "Migrations are up to date - executing command"
exec $cmd