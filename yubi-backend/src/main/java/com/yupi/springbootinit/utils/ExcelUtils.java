package com.yupi.springbootinit.utils;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.support.ExcelTypeEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.ObjectUtils;
import org.springframework.util.ResourceUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 *  Excel 相关工具类
 */
@Slf4j
public class ExcelUtils {

    /**
     * 将 Excel 文件转换为 CSV 字符串
     * @param multipartFile Excel 文件
     * @return CSV 字符串
     */
    public static String excelToCsv(MultipartFile multipartFile){
//        File file = null;
//        try {
//            file = ResourceUtils.getFile("classpath:网站数据.xlsx");
//        } catch (FileNotFoundException e) {
//            throw new RuntimeException(e);
//        }
        // 读取 Excel 文件
        List<Map<Integer, String>> list = null;
        try {
            list = EasyExcel.read(multipartFile.getInputStream())
                    .excelType(ExcelTypeEnum.XLSX)
                    .sheet()
                    .headRowNumber(0)
                    .doReadSync();
        } catch (IOException e) {
            log.error("Excel 文件转换 CSV 失败", e);
        }
        //转换为csv
        StringBuilder stringBuilder = new StringBuilder();  // 用于拼接 CSV 字符串
        //读取表头
        LinkedHashMap<Integer,String> headerMap = (LinkedHashMap) list.get(0);
        List<String> headerList = headerMap.values().stream()
                .filter(obj -> !ObjectUtils.isEmpty(obj))
                .collect(Collectors.toList());
        stringBuilder.append(String.join(",", headerList)).append("\n");
        //读取数据
        for (int i = 1 ; i<list.size();i++){
            LinkedHashMap<Integer,String> dataMap = (LinkedHashMap) list.get(i);
            List<String> dataList = dataMap.values().stream()
                    .filter(obj -> !ObjectUtils.isEmpty(obj))
                    .collect(Collectors.toList());
            stringBuilder.append(String.join(",", dataList)).append("\n");
        }
        return stringBuilder.toString();  // 返回拼接好的 CSV 字符串
    }

    public static void main(String[] args) {
        excelToCsv(null);
    }

}
