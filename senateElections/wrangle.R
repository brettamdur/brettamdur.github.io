
library(tidyverse)
setwd("~/Box/dataj/D3/senateElections")

ogSenateData <- read.csv('./earlyCSVs/1976-2020-senate.csv')

mostYears <- ogSenateData %>% 
  filter(year != 2021) %>% 
  group_by(year, state, special) %>%
  mutate(resultRank = rank(desc(candidatevotes))) %>%
  group_by(year, state, special) %>%
  summarize(
    candidateCount = n(),
    totalVotes = sum(candidatevotes),
    winnerName = candidate[which(resultRank == 1)],
    winnerParty = party_simplified[which(resultRank == 1)],
    winnerVotes = max(candidatevotes),
    winnerPct = winnerVotes / totalVotes,
    winnerVAll = (winnerPct - (1 - winnerPct)) * 100,
    secondPlaceName = candidate[which(resultRank == 2)],
    SecondPlaceParty = party_simplified[which(resultRank == 2)],
    secondPlaceVotes = candidatevotes[which(resultRank == 2)],
    secondPlacePct = secondPlaceVotes / totalVotes,
    winnerVSecond = (winnerPct - secondPlacePct) * 100
  ) 

yearlySenateData <- mostYears %>% 
  group_by(year) %>% 
  summarize(winnerVAll = mean(winnerVAll),
            winnerVSecond = mean(winnerVSecond))

##############################################################


results2022 <- read.csv('./earlyCSVs/2022.csv')
results2022 <- mutate(results2022, year = 2022)

# allHold <- pivot_longer(results2022, c(dPct, rPct), names_to = "party", values_to = "candidatevotes") %>% .[c("state", "year", "party", "candidatevotes")]
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



