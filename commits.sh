#!/usr/bin/env bash
set -eo pipefail

git ls-files -z | while IFS= read -r -d '' f; do
  # restore pristine content from current HEAD
  git checkout HEAD -- "$f"

  # who last touched this file?
  last_author=$(git log -1 --format='%an <%ae>' -- "$f")
  last_date=$(git log -1 --format='%ad' --date=iso-strict -- "$f")

  author_name=${last_author%% <*}
  author_email=${last_author##*<}
  author_email=${author_email%>}

  # stage & commit this one file with spoofed metadata
  export GIT_AUTHOR_NAME="$author_name" \
         GIT_AUTHOR_EMAIL="$author_email" \
         GIT_AUTHOR_DATE="$last_date" \
         GIT_COMMITTER_NAME="$author_name" \
         GIT_COMMITTER_EMAIL="$author_email" \
         GIT_COMMITTER_DATE="$last_date"

  git add "$f"
  git commit -m "Add $f (preserving last author/date)"
done
