# Worker adapters. Sourced by dispatch.sh and review.sh.
#
# A worker spec is  <cli>[:<model>]   e.g.  cursor:grok-4.7-xhigh   agy   pi:deepseek/deepseek-flash
#
#   run_worker <mode> <spec> <prompt>
#     mode = build   the worker may edit files and run commands
#     mode = review  the worker should not edit anything; its final answer (stdout) is the report
#
# To add a CLI, add one case to each function below. Every command runs in the current directory.

worker_cli()   { printf '%s' "${1%%:*}"; }
worker_model() { case "$1" in *:*) printf '%s' "${1#*:}" ;; esac; }

worker_label() {
  local cli model ver
  cli="$(worker_cli "$1")"; model="$(worker_model "$1")"
  case "$cli" in
    cursor) ver="$(cursor-agent --version 2>/dev/null | head -1)"; cli="cursor-agent" ;;
    *)      ver="$("$cli" --version 2>/dev/null | head -1)" ;;
  esac
  printf '%s%s / %s' "$cli" "${ver:+ $ver}" "${model:-default model}"
}

worker_check() {
  local bin
  case "$(worker_cli "$1")" in
    cursor) bin=cursor-agent ;;
    agy|claude|pi) bin="$(worker_cli "$1")" ;;
    *) echo "unknown worker: $(worker_cli "$1") (supported: cursor, agy, claude, pi; add more in workers.sh)" >&2; return 1 ;;
  esac
  command -v "$bin" >/dev/null || { echo "worker CLI not found on PATH: $bin" >&2; return 1; }
}

run_worker() {
  local mode="$1" spec="$2" prompt="$3" model
  model="$(worker_model "$spec")"
  case "$(worker_cli "$spec")" in
    cursor)
      # --force is required: without it headless cursor-agent only proposes diffs and writes nothing.
      if [ "$mode" = review ]; then
        cursor-agent -p "$prompt" --mode plan --trust --output-format text ${model:+--model "$model"}
      else
        cursor-agent -p "$prompt" --force --trust --output-format text ${model:+--model "$model"}
      fi ;;
    agy)
      if [ "$mode" = review ]; then
        agy -p "$prompt" --mode plan --dangerously-skip-permissions ${model:+--model "$model"}
      else
        agy -p "$prompt" --dangerously-skip-permissions ${model:+--model "$model"}
      fi ;;
    claude)
      if [ "$mode" = review ]; then
        claude -p "$prompt" --permission-mode plan --output-format text ${model:+--model "$model"}
      else
        claude -p "$prompt" --dangerously-skip-permissions --output-format text ${model:+--model "$model"}
      fi ;;
    pi)
      # model is "provider/model", e.g. deepseek/deepseek-flash. pi has no read-only mode;
      # in review mode it gets read + bash only (bash is needed for git diff).
      if [ "$mode" = review ]; then
        pi -p ${model:+--model "$model"} --tools read,bash,grep,find,ls "$prompt"
      else
        pi -p ${model:+--model "$model"} "$prompt"
      fi ;;
  esac
}
