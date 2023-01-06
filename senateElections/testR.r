library(tidyverse)
setwd("~/Documents/Github/brettamdur.github.io/senateElections")
library(ggplot2)
library(dplyr)
library(tidyr)
library(broom)

ogSenateData <- read.csv('./earlyCSVs/1976-2020-senate.csv')

mostYears <- ogSenateData %>%
  filter(year != 2021) %>%
  group_by(year, state, special) %>%
  mutate(resultRank = rank(desc(candidatevotes))) %>%
  group_by(year, state, special) %>%
  summarize(
    candidateCount = n()
    # totalVotes = sum(candidatevotes),
    # winnerName = candidate[which(resultRank == 1)],
    # winnerParty = party_simplified[which(resultRank == 1)],
    # winnerVotes = max(candidatevotes),
    # winnerPct = winnerVotes / totalVotes,
    # winnerVAll = (winnerPct - (1 - winnerPct)) * 100,
    # secondPlaceName = candidate[which(resultRank == 2)],
    # SecondPlaceParty = party_simplified[which(resultRank == 2)],
    # secondPlaceVotes = candidatevotes[which(resultRank == 2)],
    # secondPlacePct = secondPlaceVotes / totalVotes,
    # winnerVSecond = (winnerPct - secondPlacePct) * 100
  )

yearlySenateData <- mostYears %>%
  group_by(year) %>%
  summarize(winnerVAll = mean(winnerVAll),
            winnerVSecond = sd(winnerVSecond)
            )

genYearlyData <- function (electionData){
    electionData %>%
    group_by(year) %>%
    summarize(winnerVAll = mean(winnerVAll),
              winnerVSecond = sd(winnerVSecond)
    )
}

##############################################################


results2022 <- read.csv('./earlyCSVs/2022.csv')
results2022 <- results2022 %>% mutate(results2022, year = 2022)

allHold <- pivot_longer(results2022, c(dPct, rPct), names_to = "party", values_to = 
"candidatevotes") %>% .[c("state", "year", "party", "candidatevotes")]

dHold <- pivot_longer(results2022, dPct, names_to = "party", values_to = "candidatevotes") %>% .[c("state", "year", "party", "candidatevotes", "dCandidate")]
rHold <- pivot_longer(results2022, rPct, names_to = "party", values_to = "candidatevotes") %>% .[c("state", "year", "party", "candidatevotes", "rCandidate")]
oHold <- pivot_longer(results2022, oPct, names_to = "party", values_to = "candidatevotes") %>% .[c("state", "year", "party", "candidatevotes", "oCandidate")]
dHold <- setNames(dHold, c("state","year","party", "candidatevotes", "candidate"))
rHold <- setNames(rHold, c("state","year","party", "candidatevotes", "candidate"))
oHold <- setNames(oHold, c("state","year","party", "candidatevotes", "candidate"))
allHold <- rbind(dHold, rHold, oHold)
allHold$party[allHold$party == "dPct"] <- "DEMOCRAT"
allHold$party[allHold$party == "rPct"] <- "REPUBLICAN"
allHold$party[allHold$party == "oPct"] <- "OTHER"


wrangled2022 <- allHold %>% 
  group_by(state) %>%
  mutate(resultRank = rank(desc(candidatevotes))) %>%
  group_by(state) %>%
  summarize(
    # only used which() here bcse I had to pick one row to pull the year from.
    year = year[which(resultRank == 1)],
    candidateCount = n(),
    totalVotes = sum(candidatevotes),
    winnerName = candidate[which(resultRank == 1)],
    winnerParty = party[which(resultRank == 1)],
    winnerVotes = max(candidatevotes),
    winnerPct = winnerVotes / totalVotes,
    winnerVAll = (winnerPct - (1 - winnerPct)) * 100,
    secondPlaceName = candidate[which(resultRank == 2)],
    SecondPlaceParty = party[which(resultRank == 2)],
    secondPlaceVotes = candidatevotes[which(resultRank == 2)],
    secondPlacePct = secondPlaceVotes / totalVotes,
    winnerVSecond = (winnerPct - secondPlacePct) * 100
  )

wrangled2022 <- mutate(wrangled2022, special = "false")
allYears <- rbind(mostYears, wrangled2022)
allYears <- mutate(allYears, incumbentWinner = FALSE)
allYears <- mutate(allYears, incumbentSecond = FALSE)
allYears$winnerName <- toupper(allYears$winnerName)
allYears$secondPlaceName <- toupper(allYears$secondPlaceName)
allYears$state <- toupper(allYears$state)
allYears <- allYears %>% arrange(state, year)

# Determine winner incumbency
for(i in 4:nrow(allYears)){
  for(j in (i - 3): (i - 1)){
    if(allYears[i, ]$winnerName == allYears[j, ]$winnerName){
      if(allYears[i, ]$state == allYears[j, ]$state){
          allYears[i, ]$incumbentWinner <- TRUE
      }
    }
    if(allYears[i, ]$secondPlaceName == allYears[j, ]$winnerName){
      if(allYears[i, ]$state == allYears[j, ]$state){
        allYears[i, ]$incumbentSecond <- TRUE
      }
    }
  }
}

allYears <- allYears %>% mutate(incumbentRunning = if_else(
              ((incumbentWinner == TRUE | incumbentSecond == TRUE)),
              TRUE, FALSE
            ))

// add column to allYears called group.  It is "group1" if the year is < 1998, "group2" if the year is >= 1998
allYears <- allYears %>% mutate(group = if_else(year < 1998, "group1", "group2"))

// create a new dataframe of only the winnerVSecond and group columns of allYears
allYearsWV2 <- allYears %>% select(winnerVSecond, group)

# what is the mean of wv2 in races with and without incumbents?
mean(allYears %>% 
       filter(year >= 1982 & incumbentRunning == TRUE & winnerVSecond < 80) %>% 
       pull(winnerVSecond), na.rm = TRUE)

yearlyAll <- genYearlyData(allYears)
colnames(yearlyAll) <- c("year", "WVALLAll", "WVSecondAll")

// split yearlyAll into two dataframes, before 1998 and >= 1998
yearlyAllBefore1998 <- genYearlyData(allYears %>% filter(year < 1998))

#split yearlyAll into first section and second section for variance analysis
yearlyAllBefore1998 <- yearlyAll %>% filter(year < 1998)
yearlyAllBefore1998_numeric <- as.numeric(yearlyAllBefore1998$WVSecondAll)
yearlyAll1998AndAfter <- yearlyAll %>% filter(year >= 1998)
yearlyAll1998AndAfter_numeric <- as.numeric(yearlyAll1998AndAfter$WVSecondAll)

// delete second column from yearlyAllBefore1998_numeric
yearlyAllBefore1998_numeric <- yearlyAllBefore1998_numeric[-2]

# create separate dataframes for onlyIncumbents and noIncumbents
yearlyIncumbentsOnly <- genYearlyData(
    allYears %>% 
    filter(incumbentWinner == TRUE | incumbentSecond == TRUE) %>% 
    filter(year >= 1982)
)
colnames(yearlyIncumbentsOnly) <- c("year", "WVALLIncumbOnly", "WVSecondIncumbOnly")

yearlyNoIncumbents <- genYearlyData(allYears %>% filter(incumbentWinner == FALSE & incumbentSecond == FALSE) %>% 
                      filter(year >= 1982))
colnames(yearlyNoIncumbents) <- c("year", "WVALLNoIncumb", "WVSecondNoIncumb")

incumbentsAnalysis <- left_join(yearlyIncumbentsOnly, yearlyNoIncumbents, by="year") %>% 
                      mutate(difference = WVSecondIncumbOnly - WVSecondNoIncumb)

incumbentsAnalysisNoUnopposed <- incumbentsAnalysis %>% filter(WVSecondIncumbOnly < 80 & WVSecondNoIncumb < 80)

# plot showing line for incumbents and no incumbents
ggplot(data = incumbentsAnalysisNoUnopposed, aes(x = year)) +
  geom_line(aes(y = WVSecondIncumbOnly,  group = "WVSecondIncumbOnly", color="orange")) +
  geom_line(aes(y = WVSecondNoIncumb, group = "WVSecondNoIncumb", color="black")) +
  scale_y_reverse() +
  theme(axis.text.x = element_text(angle = 90, hjust = 1)) +
  geom_point(aes(y = WVSecondIncumbOnly, fill = "orange"), shape = 21, size = 3) +
  geom_point(aes(y = WVSecondNoIncumb, fill="black"), shape = 21, size = 3) +
  theme(axis.text.x = element_text(angle = 90, hjust = 1)) + 
  theme(panel.background = element_blank(), plot.background = element_blank())


ggplot(data = incumbentsAnalysisNoUnopposed, aes(x = year, group = 1)) +
  geom_line(aes(y = WVSecondIncumbOnly), color = "dodgerblue", alpha = 0.6) +
  geom_line(aes(y = WVSecondNoIncumb), color = "orange", alpha = 0.6) +
  geom_point(aes(y = WVSecondIncumbOnly), color = "dodgerblue", size = 4, alpha = 0.6) +
  geom_point(aes(y = WVSecondNoIncumb), color = "orange", size = 4, alpha = 0.6) +
  scale_y_reverse(limits = c(100,0), breaks = seq(100, 0, by = -10)) +
  theme(axis.text.x = element_text(angle = 90, hjust = -1, size = 18)) +
  theme(axis.text.y = element_text(size = 18)) +
  theme(panel.background = element_blank(), plot.background = element_blank())

# create the bar plot with a centered zero line
incumbentsAnalysisNoUnopposed$colors <- ifelse(incumbentsAnalysisNoUnopposed$difference < 0, "yellow", "orange")

ggplot(data = incumbentsAnalysisNoUnopposed, aes(x = difference, y = year, fill = colors)) +
  geom_bar(stat = "identity") +
  scale_fill_identity() +
  geom_vline(xintercept = 0, color = "red") +
  theme(panel.background = element_blank(), plot.background = element_blank())


# show plots of  residual winnerVsecond for each election.  Shows whether most states have 
# increasing or decreasing
allYears <- allYears %>% 
            group_by(state) %>% 
            mutate(stateWVSMean = mean(winnerVSecond)) %>%
            ungroup %>%
            mutate(residual = abs(winnerVSecond - stateWVSMean))

# get counts of increasing vs decreasing slopes for regression lines on residuals and winnerVSecond
models <- allYears %>%
  group_by(state) %>%
  do(fit = lm(residual ~ year, data = .)) %>%
  mutate(modelSlope = 0)
  # do(fit = lm(winnerVSecond ~ year, data = .))

# Create an empty vector to store the signs of the regression lines
reg_signs <- numeric(0)

# Loop through each fitted regression model.  Also, add a column for the slope, to easily
# see which states have positive vs. negative variability.
i = 0;
for(model in models$fit) {
  # browser()
  i = i + 1
  # Extract the slope of the regression line
  slope <- coef(model)[2]
  models$modelSlope[i] <- slope
  # Use the sign() function to determine the sign of the slope
  reg_signs <- c(reg_signs, sign(slope))
}

# Count the number of positive and negative regression lines
pos_count <- sum(reg_signs == 1, na.rm = TRUE)
neg_count <- sum(reg_signs == -1, na.rm = TRUE)

#create df that adds column to allYears for coloring panel label based on slope
allYearsSlope <- allYears %>% left_join(models, by = "state")
# colors <- ifelse(allYearsSlope$modelSlope > 0, "red", "blue")
# strip_background <- ifelse(allYearsSlope$modelSlope > 0, element_rect(fill = "blue"), element_rect(fill = "red"))
# Create a vector of element_rect() objects with different colors
strip_background <- allYearsSlope %>%
  group_by(state) %>%
  do(case_when(.$modelSlope > 0 ~ element_rect(fill = "blue"),
               .$modelSlope <= 0 ~ element_rect(fill = "red"))) %>%
  ungroup() %>%

allYearsSlope <- allYearsSlope %>% mutate(panelColor = ifelse(.$modelSlope > 0, "red", "blue"))

# colors <- ifelse(allYearsSlope$panelColor == "red", "red", "blue")
colors <- allYearsSlope %>%
  group_by(state) %>%
  mutate(colors = case_when(panelColor == "red" ~ "red",
                            panelColor == "blue" ~ "blue",
                            panelColor == "green" ~ "green")) %>%
  ungroup()
            


strip_background <- list()
i = 0
for(element in allYearsSlope$modelSlope){
  ifelse(element > 0, strip_background[i] <- element_rect(fill = "red"), 
         strip_background[i] <- element_rect(fill = "blue"))
  i = i + 1
}


# plot each state's regression line for variability
ggplot(data = allYearsSlope, aes(x = year, y = residual)) +
  geom_smooth(method = "lm", se = FALSE) +
  facet_wrap(~ state, ncol = 8) +
  theme(
          strip.text = element_text(size = rel(0.5), face = "bold"),
          panel.background = element_rect(fill = "white"),
          panel.border = element_rect(color="purple",fill=NA),
          plot.background = element_blank(),
          axis.ticks.x = element_blank()
        )  +
  scale_x_continuous(labels = NULL) 


# create a new column in yearlyAll that is the differece between WVSecondAll for each year and WVSecondAll for the previous year
yearlyAll$WVSecondAllDiff <- yearlyAll$WVSecondAll - lag(yearlyAll$WVSecondAll)

# create a chart that shows yearlyAl#WVSecondAllDiff for each year. The years should be on the y axis, with bars going horizontally.  There should be a line at zero, with negative bars going left and postive bars going right.
ggplot(data = yearlyAll, aes(x = WVSecondAllDiff, y = as.factor(year))) +
  geom_bar(stat = "identity") +
  geom_vline(xintercept = 0, color = "red") +
  theme(panel.background = element_blank(), plot.background = element_blank())

// create a dummy dataframe with three columns and 10 rows
df <- data.frame(x = c(1,2,3,4,5,6,7,8,9,10), 
y = c(1,2,3,4,5,6,7,8,9,10), z = c(1,2,3,4,5,6,7,8,9, 10))


// create graph that shows a dot for each winnervsecond value in allYears, with x = year and y = winnervsecond, and add a line for each year that shows the average winnervsecond for that year, and reverse the direction of the y axis() so that zero is at the top.
ggplot(data = allYears, aes(x = year, y = winnerVSecond)) +
  geom_point() +
  geom_line(aes(y = mean(winnerVSecond)), color = "red") +
  scale_y_reverse() +
  theme(panel.background = element_blank(), plot.background = element_blank())







