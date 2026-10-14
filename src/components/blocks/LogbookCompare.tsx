import { LogbookPicker } from './LogbookPicker'
import { LogbookPickerBefore } from './LogbookPickerBefore'
import { Stage } from './Stage'

/** ```logbook-compare — the same `logbook` fence drawn twice on one stage: the first pass, then the final. */
export function LogbookCompare({ content }: { content: string }) {
  return (
    <Stage>
      <div className="proto-compare">
        <div className="proto-compare-col">
          <p className="proto-compare-label">Before</p>
          <LogbookPickerBefore content={content} />
        </div>
        <div className="proto-compare-col">
          <p className="proto-compare-label" data-current>
            After
          </p>
          <LogbookPicker content={content} bare />
        </div>
      </div>
    </Stage>
  )
}
