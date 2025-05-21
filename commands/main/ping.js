import os from "os";
import v8 from "v8";

const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

export default {
  cmd: ["ping"],
  name: "ping",
  category: "main",
  description: "Detail server & cek speed",
  async execute(m, { Func: func }) {
    const start = performance.now();
    await m.react("🏓");
    const end = performance.now();
    const elapsed = end - start;
    const used = process.memoryUsage();
    const cpus = os.cpus().map((cpu) => {
      cpu.total = Object.keys(cpu.times).reduce(
        (last, type) => last + cpu.times[type],
        0,
      );
      return cpu;
    });
    const cpu = cpus.reduce(
      (last, cpu, _, { length }) => {
        last.total += cpu.total;
        last.speed += cpu.speed / length;
        last.times.user += cpu.times.user;
        last.times.nice += cpu.times.nice;
        last.times.sys += cpu.times.sys;
        last.times.idle += cpu.times.idle;
        last.times.irq += cpu.times.irq;
        return last;
      },
      {
        speed: 0,
        total: 0,
        times: {
          user: 0,
          nice: 0,
          sys: 0,
          idle: 0,
          irq: 0,
        },
      },
    );
    let heapStat = v8.getHeapStatistics();
    const x = "`";

    const resp = `bot response in \`${(elapsed / 1000).toFixed(2)} seconds\``;

    let teks = `${resp}
- Uptime =  _${func.runtime(process.uptime())}_
- CPU Core = _${cpus.length}_
- Platform =  _${os.platform()}_
- Ram = _${func.formatSize(
      os.totalmem() - os.freemem(),
    )}_ / _${func.formatSize(os.totalmem())}_
${readmore}
${x}NODE MEMORY USAGE${x}
${Object.keys(used)
  .map(
    (key, _, arr) =>
      `*- ${key.padEnd(
        Math.max(...arr.map((v) => v.length)),
        " ",
      )} =* ${func.formatSize(used[key])}`,
  )
  .join("\n")}
*- Heap Executable f=* ${func.formatSize(heapStat?.total_heap_size_executable)}
*- Physical Size =* ${func.formatSize(heapStat?.total_physical_size)}
*- Available Size =* ${func.formatSize(heapStat?.total_available_size)}
*- Heap Limit =* ${func.formatSize(heapStat?.heap_size_limit)}
*- Malloced Memory =* ${func.formatSize(heapStat?.malloced_memory)}
*- Peak Malloced Memory =* ${func.formatSize(heapStat?.peak_malloced_memory)}
*- Does Zap Garbage =* ${func.formatSize(heapStat?.does_zap_garbage)}
*- Native Contexts =* ${func.formatSize(heapStat?.number_of_native_contexts)}
*- Detached Contexts =* ${func.formatSize(
      heapStat?.number_of_detached_contexts,
    )}
*- Total Global Handles =* ${func.formatSize(
      heapStat?.total_global_handles_size,
    )}
*- Used Global Handles =* ${func.formatSize(heapStat?.used_global_handles_size)}
${
  cpus[0]
    ? `

*_Total CPU Usage_*
${cpus[0].model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times)
        .map(
          (type) =>
            `*- ${(type + "*").padEnd(6)}: ${(
              (100 * cpu.times[type]) /
              cpu.total
            ).toFixed(2)}%`,
        )
        .join("\n")}

*_CPU Core(s) Usage (${cpus.length} Core CPU)_*
${cpus
  .map(
    (cpu, i) =>
      `${i + 1}. ${cpu.model.trim()} (${cpu.speed} MHZ)\n${Object.keys(
        cpu.times,
      )
        .map(
          (type) =>
            `*- ${(type + "*").padEnd(6)}: ${(
              (100 * cpu.times[type]) /
              cpu.total
            ).toFixed(2)}%`,
        )
        .join("\n")}`,
  )
  .join("\n\n")}`
    : ""
}
`.trim();
    m.reply(teks);
  },
};