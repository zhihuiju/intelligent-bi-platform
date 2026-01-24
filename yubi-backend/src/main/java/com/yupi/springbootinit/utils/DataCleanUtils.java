package com.yupi.springbootinit.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 数据清洗工具类
 */
@Component
@Slf4j
public class DataCleanUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 清理和标准化 genChart 字符串
     * 确保存入数据库的是标准JSON格式
     */
    public static String cleanAndStandardizeGenChart(String genChart) {
        if (genChart == null || genChart.trim().isEmpty()) {
            return "{}"; // 返回空JSON对象
        }

        String cleaned = genChart.trim();

        try {
            // 情况1：检查是否是双层转义的JSON字符串（被引号包裹）
            if (cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
                // 去除外层引号
                String unquoted = cleaned.substring(1, cleaned.length() - 1);

                try {
                    // 尝试解析内部字符串
                    Object parsed = objectMapper.readValue(unquoted, Object.class);
                    // 序列化为标准JSON格式
                    return objectMapper.writeValueAsString(parsed);
                } catch (JsonProcessingException innerException) {
                    // 如果内部解析失败，可能是普通字符串，直接返回原内容
                    return cleaned;
                }
            }

            // 情况2：尝试直接解析为JSON
            try {
                Object parsed = objectMapper.readValue(cleaned, Object.class);
                // 序列化为标准JSON格式（美化或紧凑格式）
                return objectMapper.writeValueAsString(parsed);
            } catch (JsonProcessingException e) {
                // 如果不是有效JSON，尝试修复常见问题
                return tryFixJsonFormat(cleaned);
            }

        } catch (Exception e) {
            log.error("清理 genChart 失败，返回原始内容", e);
            return cleaned; // 返回原始内容，不丢失数据
        }
    }

    /**
     * 尝试修复常见的JSON格式问题
     */
    private static String tryFixJsonFormat(String jsonStr) {
        String fixed = jsonStr;

        // 1. 修复属性名缺少双引号的问题
        // 匹配 pattern: { key: value } → { "key": value }
        fixed = fixed.replaceAll("([{, ])\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*:", "$1\"$2\":");

        // 2. 修复单引号问题
        fixed = fixed.replace('\'', '"');

        // 3. 修复尾随逗号
        fixed = fixed.replaceAll(",\\s*}", "}");
        fixed = fixed.replaceAll(",\\s*]", "]");

        // 4. 尝试再次解析
        try {
            Object parsed = objectMapper.readValue(fixed, Object.class);
            return objectMapper.writeValueAsString(parsed);
        } catch (JsonProcessingException e) {
            log.warn("无法修复JSON格式，返回原始内容: {}", jsonStr);
            return jsonStr; // 返回原始内容
        }
    }

    /**
     * 清理 genResult 字符串
     * 移除多余转义字符和AI返回的元数据
     */
    public static String cleanGenResult(String genResult) {
        if (genResult == null || genResult.trim().isEmpty()) {
            return "";
        }

        String cleaned = genResult.trim();

        // 1. 处理转义字符
        cleaned = cleaned.replace("\\n", "\n")
                .replace("\\t", "\t")
                .replace("\\r", "\r")
                .replace("\\\\", "\\");

        // 2. 移除可能的JSON元数据（AI返回的完整响应格式）
        // 例如：移除类似 "role":"assistant" 之后的内容
        int jsonEndIndex = cleaned.indexOf("\"role\":\"assistant\"");
        if (jsonEndIndex > -1) {
            cleaned = cleaned.substring(0, jsonEndIndex).trim();
        }

        // 3. 移除其他可能的元数据字段
        String[] metadataMarkers = {
                "\"finish_reason\"",
                "\"index\":",
                "\"logprobs\":",
                "\"content\":",
                "\"function_call\":"
        };

        for (String marker : metadataMarkers) {
            int markerIndex = cleaned.indexOf(marker);
            if (markerIndex > -1) {
                // 找到 marker 前面的最近的大括号或中括号开始位置
                int cutIndex = findCutIndex(cleaned, markerIndex);
                if (cutIndex > 0) {
                    cleaned = cleaned.substring(0, cutIndex).trim();
                    break;
                }
            }
        }

        // 4. 确保不是空字符串
        return cleaned.isEmpty() ? "分析结论为空" : cleaned;
    }

    /**
     * 找到切割点（在 marker 前最近的 { 或 [ 位置）
     */
    private static int findCutIndex(String text, int markerIndex) {
        for (int i = markerIndex - 1; i >= 0; i--) {
            char c = text.charAt(i);
            if (c == '{' || c == '[') {
                return i;
            }
        }
        return -1;
    }
}
