library(dplyr)
library(tidyr)
library(ggplot2)
library(reshape2)
library(jsonlite)
library(stringr)

# library(vscDebugger)

# change the working directory to the folder where the data is stored
setwd("/Users//jaycooney//Documents//GitHub//brettamdur.github.io//budget/")


dataOutlays <- read.csv("./data/outlays.csv")

# create a table that summarizes the data by Agency.Name, showing the 2023 outlay amount for each Agency.Name, and adding commas to the format of the Outlay column

allAgencies <- dataOutlays %>% 
  group_by(Agency.Name) %>% 
  summarise(
        bureauCount = n_distinct(Bureau.Name),
        lineCount = n(),
        outlay24 = sum(X2024) / 1000, # original data was in thousands, so this puts it in millions
        outlay23 = sum(X2023) / 1000, 
        diff = outlay24 - outlay23,
        pctdiff = (outlay24 - outlay23) / outlay23
        ) %>%
        arrange(desc(outlay24))


bigAgencies <- allAgencies %>%
    filter(outlay24 >= 1000) %>%  # filtering to agencies wtih outlays of $1 billion or more
    arrange(desc(outlay24))  # %>%
    # head(10)

smallAgencies <- allAgencies %>%
    filter(outlay24 < 1000) %>%
    filter(outlay24 > 0)

# filter dataOutlays to only include lines associated with the bigAgency agencies
bigAgencyLines <- dataOutlays %>%
    filter(Agency.Name %in% bigAgencies$Agency.Name)

# create a dataframe that shows the top five bureaus for all agencies in bigAgencies
bigAgencyTopBureaus <- bigAgencyLines %>% 
    group_by(Agency.Name, Bureau.Name) %>%
    summarise(
        outlay24 = sum(X2024) / 1000, 
        outlay23 = sum(X2023) / 1000,
        diff = outlay24 - outlay23,
        pctdiff = (outlay24 - outlay23) / outlay23
    ) %>%
    # get the top five bureaus for each agency
    arrange(desc(outlay24)) %>%
    group_by(Agency.Name) %>%
    top_n(5, outlay24)

# create a list of unique agencies in bigAgencyTopBureaus
uniqueBigAgencies <- unique(bigAgencyTopBureaus$Agency.Name)

# create a dataframe with two columns: one named child and one named parent.  The value of parent is always "BudgetRoot".  The value of child is the name of each agency in bigAgencyTopBureausAgencies. The number of rows in this dataframe is equal to the number of unique agencies in bigAgencyTopBureausAgencies.
dataToAdd <- data.frame(
    parent = "BudgetRoot",
    child = uniqueBigAgencies
)
# add columns to dataToAdd
dataToAdd$outlay24 <- NA
dataToAdd$outlay23 <- NA
dataToAdd$diff <- NA
dataToAdd$pctdiff <- NA

# add a row to dataToAdd where parent is NA and child is "BudgetRoot", and all other columns are NA
dataToAdd <- rbind(dataToAdd, data.frame(parent = "", child = "BudgetRoot", outlay24 = NA, outlay23 = NA, diff = NA, pctdiff = NA))



# rename the columns in bigAgencyTopBureaus to match the names of the columns in dataToAdd
colnames(bigAgencyTopBureaus) <- c("parent", "child", "outlay24", "outlay23", "diff", "pctdiff")

# combine the two dataframes
bigAgencyTopBureaus <- rbind(dataToAdd, bigAgencyTopBureaus)

# show all lines in bigAgencyTopBureaus where parent is equal to child
# dupes <- bigAgencyTopBureaus %>%
#    filter(parent == child)

# whenever parent is equal to child, edit child so that its name is equal to its original name plus " (Bureau)"
bigAgencyTopBureaus$child <- ifelse(bigAgencyTopBureaus$parent == bigAgencyTopBureaus$child, 
    paste(bigAgencyTopBureaus$child, "- Bureau", sep = " "), bigAgencyTopBureaus$child)


# show all rows where child ends with " (Bureau)"
#bigAgencyTopBureaus %>%
#    filter(str_detect(child, " (Bureau)$"))


# write bigagencytopbureaus to a csv file
write.csv(bigAgencyTopBureaus, "./data/bigAgencyTopBureaus.csv", row.names = FALSE)


#########################
#########################
#########################
#########################


# what percentage is bigAgencyTopBureaus outlay24 of the total outlay24 for all agencies?  NOTE: if you include negative outlays in smallAgencies, than the part (bigAgencies$outlay24) will be greater than the whole (allAgencies$outlay24).
sum(bigAbigAgencyTopBureaus$outlay24) / 
    (
        sum(dataOutlays %>%
        # excluding negative outlays here
        # filter(X2024 > 0) %>% 
        select(X2024)) / 1000
    )

# NOTE: TopBureaus (the part) is bigger than bigAgencies (the whole) because bigAgencies includes negative outlays that are excluded from TopBureaus.

#sum(bigAgencyTopBureaus$outlay24, na.rm = TRUE)
#[1] 7377256
#
#r$> sum(bigAgencies$outlay24)
#[1] 7200595

# what percentage is the sum of outlay24 for the top 20 agencies, ranked by outlay24, of the total outlay24 for all agencies?
(allAgencies %>%
    arrange(desc(outlay24)) %>%
    # head(20) %>%
    summarise(sum(outlay24))) / (sum(bigAgencies$outlay24) + sum(smallAgencies$outlay24))


# how many unique bureaus are there in topFiveLines?
length(unique(topFiveLines$Bureau.Name))

# from dataOutlays, filter to bureau name "military personnel"
View(dataOutlays %>%
    filter(Bureau.Name == "Military Personnel") %>%
    select(Agency.Name, Bureau.Name, Account.Name, X2024) %>%
    mutate(X2024 = X2024 / 1000))

# from dataOulays, filter to agency.name "Department of Defense--Military Programs", then group by bureau.name, then sum the outlay24 for each bureau.name
View(dataOutlays %>%
    filter(Agency.Name == "Social Security Administration") %>%
    # group_by(Bureau.Name) %>%
    summarise(outlay24 = sum(X2024) / 1000) %>%
    arrange(desc(outlay24)))

# how many unique bureaus are there in each of the top 10 agencies in dataOutlays, ranked by outlay24?

View(
        dataOutlays %>%
        group_by(Agency.Name) %>%
        summarise(outlay2024 = sum(X2024), bureauCount = n_distinct(Bureau.Name)) %>%
        arrange(desc(outlay2024)) %>%
        head(10)  #%>%
        # summarise(sum(outlay2024))
)

json_data <- jsonlite::toJSON(
  split(topFiveBureaus, topFiveBureaus$Agency.Name),
  auto_unbox = TRUE,
  pretty = TRUE
)




json_data <- bigAgencyTopBureaus %>%
  # Group by Agency.Name and Bureau.Name
  group_by(Agency.Name, Bureau.Name) %>%
  # Sum outlay24 within each group
  summarize(size = sum(outlay24)) %>%
  arrange(desc(size)) %>%
  # Nest by Agency.Name and create children for each Bureau.Name
  nest(children = c(Bureau.Name, size)) %>%
  # Create a nested list with the desired structure
  toJSON(., 
         # Convert the nested list into a hierarchical JSON structure with name/value pairs
         auto_unbox = TRUE,
         # Specify the name of the top-level object
         json_object = "name",
         # Specify the name of the nested object containing the children
         json_array = "children",
         # Specify the name of the object containing the size value
         json_value = "size",
         # Set the indentation level to make the JSON data easier to read
         pretty = TRUE)

# Print the resulting JSON data
head(cat(json_data))

# filter dataoutlays to only include lines where x2024 is greater than 0, and then returnn the sum of x2024
sum(dataOutlays %>%
    filter(X2024 > 0) %>%
    select(X2024))

# how many unique Agency-Bureau pairs are there in bigAgencyTopBureaus?
bigAgencyTopBureaus %>% distinct (agency, bureau) %>% nrow()
bigAgencyTopBureaus %>% distinct (bureau) %>% nrow()

json_data <- toJSON(bigAgencyTopBureaus, pretty = TRUE)

otherAgencies <- allAgencies %>%
  anti_join(bigAgencies, by = "Agency.Name")

otherAgencies2 <- otherAgencies %>%
  anti_join(smallAgencies, by = "Agency.Name")

