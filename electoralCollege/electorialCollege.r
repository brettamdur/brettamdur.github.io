library(tidyr)
library(dplyr)
library(ggplot2)

# Need to fix this for Maine and Nebraska.  Best approach: treat each district as its own state.  Assign each district electoral votes equal to 1 plus 2 divided by the number of districts.  So each district in Maine gets 2 electoral votes (1 + (2/2)).  Each district in Nebraska gets 1.66 (1 + (2/3)).

########################
######## 2020 ##########
########################

setwd("./electoralCollege")
data2020 <- read.csv('./data/2020.csv', header = TRUE)

# select all columns except the last four
# data2020 <- data2020[, 1 : (ncol(data2020) - 4)]

# remove rows 52 to end
data2020 <- data2020[1:51, ]

#if a column name stars with X, remove the X
colnames(data2020) <- gsub("^X", "", colnames(data2020))

#convert data2020$ApportionPop to numeric
data2020$ApportionPop <- as.numeric(gsub(",", "", data2020$ApportionPop))

#rename data$2020Winner to data2020$Winner
#data2020$Winner <- data2020$`2020Winner`

#rename data2020$2020BVotes to data2020$BVotes
data2020 <- data2020 %>% rename(BVotes = `2020BVotes`)
data2020 <- data2020 %>% rename(TVotes = `2020TVotes`)

write.csv(data2020, file = "./data/rData2020.csv", row.names = FALSE)


#### MISC STUFF ####

ecvPower2020 <- data2020 %>% group_by(`Winner`) %>% 
    summarise(count = n(), ECVotes = sum(ECVotes), ECVPM_A = mean(as.numeric(ECVPM_ApportPop)), ECVPM_V = mean(as.numeric(ECV_perTurnout))) 

lower_ECVPM_A <- min(ecvPower2020$ECVPM_A)
higher_ECVPM_A <- max(ecvPower2020$ECVPM_A)
percent_diff_ECVPM_A <- 100 * (higher_ECVPM_A - lower_ECVPM_A) / lower_ECVPM_A

lower_ECVPM_V <- min(ecvPower2020$ECVPM_V)
higher_ECVPM_V <- max(ecvPower2020$ECVPM_V)
percent_diff_ECVPM_V <- 100 * (higher_ECVPM_V - lower_ECVPM_V) / lower_ECVPM_V

percent_diff_df <- data.frame(
Winner = "Percent Difference",
count = NA,
ECVotes = NA,
ECVPM_A = percent_diff_ECVPM_A,
ECVPM_V = percent_diff_ECVPM_V
)

ecvPower2020 <- rbind(ecvPower2020, percent_diff_df)

ecvDeviation_voters <- data %>% group_by(`2020Winner`) %>% 
    summarise(count = n(), ECV_deviationMean = mean(as.numeric(ECV_deviation)))

ecvDeviation_apportioned <- data %>% group_by(`2020Winner`) %>% 
    summarise(count = n(), ECV_deviationMean = mean(as.numeric(ECVPM_deviation)))

ecvPower_apportioned <- data %>% group_by(`2020Winner`) %>% 
    summarise(ECVPM_ECVPM_A = mean(as.numeric(ECVPM_ApportPop)))

data2020 %>% group_by(`Winner`) %>% 
    summarise(allPop = sum(ApportionPop), allECV = sum(ECVotes), ECPerPop = (sum(ECVotes) / sum(ApportionPop)) * 1000000, devByState = mean(ECVPM_deviation))

# how many states have positive values of ECV_deviation
data %>% filter(ECV_deviation < 0) %>% count(`2020Winner`)

# Why are these two numbers different?
# total EC Votes per 1M in Apportion Population:
(sum(data$ECVotes) / sum(data$ApportionPop)) * 1000000
# same thing, but on a per state basis:
mean(data$ECVPM_ApportPop)


########################
######## 2016 ##########
########################

data2016 <- read.csv('./data/2016.csv', header = TRUE)
# remove last two rows of data2016
data2016 <- data2016[1:51, ]
# if a column name has a "." in it, remove it
colnames(data2016) <- gsub("\\.", "", colnames(data2016))
# replace the values of data2020$ECVotes with the values of data2016$TotalEV


# if any data has a % sign in it, remove it
data2016 <- data2016 %>% mutate_if(is.character, gsub, pattern = "%", replacement = "")
# if any data has a comma in it, remove it
data2016 <- data2016 %>% mutate_if(is.character, gsub, pattern = ",", replacement = "")
#if any data has a "_" in it, convert it to 0
data2016 <- data2016 %>% mutate_if(is.character, gsub, pattern = "_", replacement = "0")
data2016 <- data2016 %>% mutate_if(is.character, gsub, pattern = "-", replacement = "0")
# convert WinnerMargin to numeric.  Wow, this is way harder than it should be.
is_negative <- grep("^[^0-9]", data2016$WinnerMargin)
data2016$WinnerMargin[is_negative] <- gsub("^[^0-9]", "", data2016$WinnerMargin[is_negative])
data2016$WinnerMargin <- as.numeric(data2016$WinnerMargin)
data2016$WinnerMargin[is_negative] <- data2016$WinnerMargin[is_negative] * -1
# sort by WinnerMargin descending
data2016 <- data2016[order(data2016$WinnerMargin, decreasing = TRUE), ]
# create a new column that tracks a running total of the EC Votes
data2016$RunningECVotes <- cumsum(data2016$TotalEV)

# add a column called ECVPM_ApportionPop that is the EC Votes per 1M in Apportioned Population
data2016$ECVPM_ApportionPop <- (data2016$TotalEV / data2016$ApportionPop) * 1000000


write.csv(data2016, file = "./data/rData2016.csv", row.names = FALSE)


# MISC STUFF #
ecvPower2016 <- data2016 %>% group_by(`Winner`) %>% 
    summarise(count = n(), ECVotes = sum(Total.EV), ECVPM_A = mean(as.numeric(ECVPM_ApportionPop)), ECVPM_V = mean(as.numeric(ECPerVoter))) 

lower_ECVPM_A <- min(ecvPower2016$ECVPM_A)
higher_ECVPM_A <- max(ecvPower2016$ECVPM_A)
percent_diff_ECVPM_A <- 100 * (higher_ECVPM_A - lower_ECVPM_A) / lower_ECVPM_A

lower_ECVPM_V <- min(ecvPower2016$ECVPM_V)
higher_ECVPM_V <- max(ecvPower2016$ECVPM_V)
percent_diff_ECVPM_V <- 100 * (higher_ECVPM_V - lower_ECVPM_V) / lower_ECVPM_V

percent_diff_df <- data.frame(
Winner = "Percent Difference",
count = NA,
ECVotes = NA,
ECVPM_A = percent_diff_ECVPM_A,
ECVPM_V = percent_diff_ECVPM_V
)

ecvPower2016 <- rbind(ecvPower2016, percent_diff_df)


###############




#### MISC STUFF ####
ecvPower_voters_2016 <- data2016 %>% group_by(`Winner`) %>% 
    summarise(count = n(), ECVPM_perVoterMean = mean(as.numeric(ECPerVoter)))

data2016 %>% group_by(`Winner`) %>% 
    summarise(count = n(), allPop = sum(ApportionPop), allECV = sum(Total.EV), perPop = (sum(Total.EV) / sum(ApportionPop)) * 1000000)

# create a new df from data2016 that exludes the row where bbreviation = "DC" and CA
data2016_noDC <- data2016 %>% filter(Abbreviation != "DC") %>% filter(Abbreviation != "CA")


# create a scatterplot from data2016, with TotalEV on the x-axis and the absolute value of WinnerMargin on the y-axis
ggplot(data = data2016, aes(x = TotalEV, y = abs(WinnerMargin))) + geom_point()
# add a regression line to the scatterplot
ggplot(data = data2016, aes(x = ApportionPop, y = abs(WinnerMargin))) + geom_point() + geom_smooth(method = "lm")
# use actual values in the x-axis rather than scientific notation
ggplot(data = data2016, aes(x = ApportionPop, y = abs(WinnerMargin))) + geom_point() + geom_smooth(method = "lm") + scale_x_continuous(labels = scales::comma)
# remove the point for DC
ggplot(data = data2016_noDC, aes(x = ApportionPop, y = abs(WinnerMargin))) + geom_point() + geom_smooth(method = "lm") + scale_x_continuous(labels = scales::comma)
# color the dots by Winner, blue for C and red for T
ggplot(data = data2016, aes(x = ApportionPop, y = abs(WinnerMargin), color = Winner)) + geom_point() + geom_smooth(method = "lm") + scale_x_continuous(labels = scales::comma)
# add the abbreviation for each dot as a lable
ggplot(data = data2016, aes(x = ApportionPop, y = abs(WinnerMargin), color = Winner)) + geom_point() + geom_smooth(method = "lm") + scale_x_continuous(labels = scales::comma) + geom_text(aes(label = Abbreviation), vjust = -0.5, hjust = 0.5)
# use a smaller font for the labels
ggplot(data = data2016, aes(x = ApportionPop, y = abs(WinnerMargin), color = Winner)) + geom_point() + geom_smooth(method = "lm") + scale_x_continuous(labels = scales::comma) + geom_text(aes(label = Abbreviation), vjust = -0.5, hjust = 0.5, size = 2)
# remove the confidence intervals from the regression lines
ggplot(data = data2016, aes(x = ApportionPop, y = abs(WinnerMargin), color = Winner)) + geom_point() + geom_smooth(method = "lm", se = FALSE) + scale_x_continuous(labels = scales::comma) + geom_text(aes(label = Abbreviation), vjust = -0.5, hjust = 0.5, size = 2)
# use blue dots for Clinton and red dots for Trump

# get rid of grey background in code below

ggplot(data = data2016, aes(
        x = ApportionPop,
        y = abs(WinnerMargin), color = Winner)
      ) +
    geom_point() +
    geom_smooth(method = "lm", se = FALSE) +
    scale_x_continuous(labels = scales::comma) +
    geom_text(aes(label = Abbreviation), vjust = -0.5, hjust = 0.7, size = 2) +
    scale_color_manual(values = c("#2d98ef", "#d75c5c"), labels = c("D", "R")) +
    # set x-axis label to "Population" and y axis label to "Winner Margin (Pct. Points)"
    xlab("Population") + ylab("Winner Margin (% Points)") +
    # reduce the font of the x-axis and y-axis labels, and the text of the axes themselves
    theme(axis.text.x = element_text(size = 8), axis.text.y = element_text(size = 8), axis.title.x = element_text(size = 8), axis.title.y = element_text(size = 8), text = element_text(family = "Inter"), legend.title = element_blank(), legend.key = element_rect(fill = NA), panel.background = element_blank()) +
    # set title of chart to "2016: Winner Margin vs. Population"
    ggtitle("2016: Winner Margin vs. Population") +
    # make the title a smaller font, use Inter font, and center it and bold it
    theme(plot.title = element_text(size = 10, family = "Inter", hjust = 0.5, face = "bold"))

    
ggplot(data = data2020, aes(
        x = ApportionPop,
        y = abs(WinnerMargin), color = Winner)
      ) +
    geom_point() +
    geom_smooth(method = "lm", se = FALSE) +
    scale_x_continuous(labels = scales::comma) +
    geom_text(aes(label = Abbreviate), vjust = -0.5, hjust = 0.7, size = 2) +
    scale_color_manual(values = c("#2d98ef", "#d75c5c"), labels = c("D", "R")) +
    # set x-axis label to "Population" and y axis label to "Winner Margin (Pct. Points)"
    xlab("Population") + ylab("Winner Margin (% Points)") +
    # reduce the font of the x-axis and y-axis labels, and the text of the axes themselves
    theme(axis.text.x = element_text(size = 8), axis.text.y = element_text(size = 8), axis.title.x = element_text(size = 8), axis.title.y = element_text(size = 8), text = element_text(family = "Inter"), legend.title = element_blank(), legend.key = element_rect(fill = NA), panel.background = element_blank()) +
    ggtitle("2020: Winner Margin vs. Population") +
    theme(plot.title = element_text(size = 10, family = "Inter", hjust = 0.5, face = "bold"))

data2016 %>% group_by(`Winner`) %>% 
    summarise(count = n(), Pop = sum(ApportionPop), EV = sum(TotalEV), pct = EV / Pop * 1000000)

# create a new df that shows, for each state, the difference between 2020 apportioned population and 2016 apportioned population
diffApportionPops <- merge(data2020, data2016, by.x = "Abbreviate", by.y = "Abbreviation") 

differences <-
    diffApportionPops %>%
    select(Abbreviate, `ApportionPop.x`, `ApportionPop.y`, ECVotes, TotalEV) %>% 
    mutate(PopDiff = `ApportionPop.x` - `ApportionPop.y`) %>%
    mutate(ECVotesDiff = ECVotes -  TotalEV)


# select rows from differences that have a non-zero value for PopDiff or ECVotesDiff
View(differences %>% filter(PopDiff != 0 | ECVotesDiff != 0))

    


###### 2000 ######

# get current working directory
setwd('../electoralCollege')
data2000 <- read.csv('./data/2000.csv', header = TRUE)

ggplot(data = data2000, aes(
        x = Population,
        y = abs(RWinnerMargin), color = Winner)
      ) +
    geom_point() +
    geom_smooth(method = "lm", se = FALSE) +
    scale_x_continuous(labels = scales::comma) +
    geom_text(aes(label = Abbreviate), vjust = -0.5, hjust = 0.7, size = 2) +
    scale_color_manual(values = c("#2d98ef", "#d75c5c"), labels = c("D", "R")) +
    xlab("Population") + ylab("Winner Margin (% Points)") +
    # set x-axis to go from 0 to 40 million in increments of 10 million, and us comma to separate thousands
    scale_x_continuous(breaks = seq(0, 40000000, 10000000), labels = scales::comma, limits = c(0, 40000000)) +
    theme(axis.text.x = element_text(size = 8), axis.text.y = element_text(size = 8), axis.title.x = element_text(size = 8), axis.title.y = element_text(size = 8), text = element_text(family = "Inter"), legend.title = element_blank(), legend.key = element_rect(fill = NA), panel.background = element_blank()) +
    ggtitle("2000: Winner Margin vs. Population") +
    theme(plot.title = element_text(size = 10, family = "Inter", hjust = 0.5, face = "bold"))
    




 