library(dplyr)
library(tidyr)
library(ggplot2)
library(reshape2)
# library(vscDebugger)

# change the working directory to the folder where the data is stored
setwd("/Users//jaycooney//Documents//GitHub//brettamdur.github.io//budget/")


dataOutlays <- read.csv("./data/outlays.csv")

# create a table that summarizes the data by Agency.Name, showing the 2023 outlay amount for each Agency.Name, and adding commas to the format of the Outlay column

hold <- dataOutlays %>% 
  group_by(Agency.Name) %>% 
  summarise(
        bureauCount = n(),
        outlay23 = sum(X2023),
        outlay22 = sum(X2022), 
        diff = outlay23 - outlay22,
        pctdiff = (outlay23 - outlay22) / outlay22
        ) %>%
  arrange(desc(outlay23)) %>%
  # filter out agencies with less than $1 billion in outlays in 2023
    filter(outlay23 > 1000000) 
  # head(10) %>% 
  # knitr::kable()

# add a column to hold that shows the Outlay column in a format that uses commas.  call it Outlay.Comma

hold$Outlay.Comma <- hold$Outlay   
hold$Outlay.Comma <- format(hold$Outlay.Comma, big.mark = ",")

# create a table that shows how many bureau codes are in each agency

hold2 <- dataOutlays %>% 
  group_by(Agency.Name) %>% 
  summarise(
        count = n(), 
        outlay23 = sum(X2023)
        ) %>%
  arrange(desc(count)) %>%
  # filter out agencies with less than $1 billion in outlays in 2023
    filter(outlay23 > 1000000)
  # head(10) %>% 
  # knitr::kable()

#how many bureaus are in the department of education?
hold3 <- View(dataOutlays %>% filter(Agency.Name == "Department of Education"))

#  create a column in hold 3 that shows the difference between 2023 and 2022 outlays
hold3 <- dataOutlays %>%
    mutate(diff = X2023 - X2022) %>%
    mutate(pctdiff = (X2023 - X2022) / X2022) %>%
    select(Agency.Name, Bureau.Name, Account.Name, X2023, X2022, diff, pctdiff) %>%
    filter(Agency.Name == "Department of Education")




      
      
      
      
        mutate(diff = X2023 - X2022) %>%
        mutate(pctdiff = (X2023 - X2022) / X2022) %>%
        select(Bureau.Name, X2023, X2022, diff)

# in hold3, show only bureau, outlay 2023, outlay 2022, and diff
hold4 <- View(hold3 %>% select(Bureau, X2023, X2022, diff))


