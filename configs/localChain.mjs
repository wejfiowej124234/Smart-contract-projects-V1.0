/**
 * 本地链 RPC 与 chainId 唯一来源（Node 脚本 / CI / E2E 用）。
 * 与 frontend/src/config/network.ts 的 DEFAULT_LOCAL_RPC、LOCAL_CHAIN_ID 及 hardhat.config.ts 的 localhost 保持一致。
 * 脚本应从此文件或环境变量读取，禁止在脚本内写死 127.0.0.1:8545 或 31337。
 *
 * 环境变量覆盖：LOCAL_RPC_URL（对应前端的 VITE_LOCAL_RPC_URL）。
 */
export const RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
export const LOCAL_CHAIN_ID = 31337;
