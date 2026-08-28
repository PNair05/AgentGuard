import type { ProductVisual } from "@/lib/store/types";

export function ProductArtwork({ visual }: { visual: ProductVisual }) {
  if (visual === "headphones") {
    return <svg viewBox="0 0 280 210" role="img" aria-label="Over-ear headphones"><path className="art-shadow" d="M60 173c31-18 134-18 163 1-29 15-132 17-163-1Z"/><path className="art-main" d="M74 111c0-49 28-77 66-77s66 28 66 77"/><path className="art-dark" d="M69 105h20v72H69c-12 0-22-10-22-22v-28c0-12 10-22 22-22ZM211 105h-20v72h20c12 0 22-10 22-22v-28c0-12-10-22-22-22Z"/><rect className="art-light" x="60" y="117" width="28" height="49" rx="13"/><rect className="art-light" x="192" y="117" width="28" height="49" rx="13"/></svg>;
  }
  if (visual === "speaker") {
    return <svg viewBox="0 0 280 210" role="img" aria-label="Portable speaker"><path className="art-shadow" d="M69 177c34-14 115-14 143 0-31 13-111 14-143 0Z"/><rect className="art-dark" x="68" y="49" width="144" height="122" rx="38"/><circle className="art-main" cx="140" cy="110" r="47"/><circle className="art-light" cx="140" cy="110" r="25"/><circle className="art-pop" cx="184" cy="70" r="5"/></svg>;
  }
  if (visual === "tracker") {
    return <svg viewBox="0 0 280 210" role="img" aria-label="Two item trackers"><path className="art-shadow" d="M68 174c35-15 119-14 150 1-31 13-119 13-150-1Z"/><g transform="rotate(-12 112 111)"><rect className="art-dark" x="61" y="61" width="102" height="105" rx="34"/><circle className="art-light" cx="112" cy="113" r="23"/><circle className="art-pop" cx="112" cy="113" r="7"/></g><g transform="rotate(10 175 111)"><rect className="art-main" x="129" y="54" width="92" height="112" rx="32"/><circle className="art-light" cx="175" cy="110" r="21"/><circle className="art-dark" cx="175" cy="110" r="6"/></g></svg>;
  }
  if (visual === "course") {
    return <svg viewBox="0 0 280 210" role="img" aria-label="Sound design course"><path className="art-shadow" d="M43 174c44-14 149-14 193 0-43 14-149 14-193 0Z"/><rect className="art-dark" x="42" y="44" width="196" height="124" rx="12"/><rect className="art-light" x="55" y="57" width="170" height="91" rx="5"/><path className="art-main" d="M69 116h10V91H69v25Zm19 0h10V77H88v39Zm19 0h10V96h-10v20Zm19 0h10V69h-10v47Zm19 0h10V87h-10v29Zm19 0h10V74h-10v42Zm19 0h10V93h-10v23Z"/><path className="art-pop" d="m124 133 18-13v26l-18-13Z"/></svg>;
  }
  if (visual === "desk") {
    return <svg viewBox="0 0 280 210" role="img" aria-label="Standing desk"><path className="art-shadow" d="M33 182c48-12 170-12 217 0-45 11-168 11-217 0Z"/><rect className="art-main" x="30" y="62" width="220" height="24" rx="7"/><path className="art-dark" d="M58 84h15v88H58zM207 84h15v88h-15z"/><rect className="art-light" x="91" y="29" width="98" height="58" rx="8"/><rect className="art-dark" x="101" y="38" width="78" height="40" rx="3"/><path className="art-pop" d="M129 87h22v15h-22z"/></svg>;
  }
  return <svg viewBox="0 0 280 210" role="img" aria-label="Premium carry-on"><path className="art-shadow" d="M68 183c35-14 112-14 146 0-32 13-111 13-146 0Z"/><path className="art-dark" d="M105 50V38c0-12 9-20 21-20h29c12 0 21 8 21 20v12h-12V39c0-6-4-10-10-10h-27c-6 0-10 4-10 10v11h-12Z"/><rect className="art-main" x="76" y="45" width="128" height="132" rx="27"/><path className="art-light" d="M104 55v111M140 55v111M176 55v111"/><circle className="art-dark" cx="103" cy="182" r="7"/><circle className="art-dark" cx="177" cy="182" r="7"/></svg>;
}
