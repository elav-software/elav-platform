#!/bin/bash
branch=$(git rev-parse --abbrev-ref HEAD)
echo ""
echo "  Rama actual: $branch"
echo ""
read -p "  Mensaje del commit: " msg

if [ -z "$msg" ]; then
  echo "  Mensaje vacío. Cancelado."
  exit 1
fi

git add .
git commit -m "$msg"
git push origin "$branch"

echo ""
echo "  Push a '$branch' completado."
