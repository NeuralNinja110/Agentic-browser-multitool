import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const toolExecutions = pgTable("tool_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  toolName: text("tool_name").notNull(),
  input: jsonb("input").notNull(),
  output: jsonb("output").notNull(),
  status: text("status").notNull(), // 'pending', 'success', 'error'
  executionTime: integer("execution_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Message types
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string(),
  toolCalls: z.array(z.object({
    id: z.string(),
    type: z.literal('function'),
    function: z.object({
      name: z.string(),
      arguments: z.string(),
    }),
  })).optional(),
  toolCallId: z.string().optional(),
  timestamp: z.union([z.date(), z.string()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

// Tool call schemas
export const googleSearchSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(10).default(5),
});

export const aiPipeSchema = z.object({
  workflow: z.string(),
  inputData: z.record(z.any()).optional(),
});

export const jsExecutionSchema = z.object({
  code: z.string(),
  timeout: z.number().min(1000).max(30000).default(5000),
});

// Agent configuration
export const agentConfigSchema = z.object({
  provider: z.enum(['aipipe', 'openai', 'anthropic', 'google', 'cohere']),
  model: z.string(),
  apiKey: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolExecutionSchema = createInsertSchema(toolExecutions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = z.infer<typeof messageSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type ToolExecution = typeof toolExecutions.$inferSelect;
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type GoogleSearchParams = z.infer<typeof googleSearchSchema>;
export type AiPipeParams = z.infer<typeof aiPipeSchema>;
export type JsExecutionParams = z.infer<typeof jsExecutionSchema>;
