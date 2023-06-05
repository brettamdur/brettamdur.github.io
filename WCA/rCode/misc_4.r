

  #####################
 #### SETUP ##########
#####################

    library(tidycensus)
    library(tidyverse)
    library(scales)
    library(ggrepel)
    library(ggwaffle)
    library(hrbrthemes)
    library(waffle)
    library(ggtext)
    library(RColorBrewer)

    # census_api_key("fb913302b479cf7bf43a2e3d397436921a86789e", install = "TRUE")
    # readRenviron("~/.Renviron")

    acsVariables2021 <- load_variables(2021, "acs5")

    colorPalette <- c(
      red= "#fd7f6f", 
      blue = "#7eb0d5", 
      green = "#b2e061", 
      purple = "#bd7ebe", 
      orange = "#ffb55a", 
      yellow = "#ffee65", 
      palePurple = "#beb9db", 
      pink = "#fdcce5", 
      green = "#8bd3c7"
    )

    comparableCounties <- c("Bronx", "Erie", "Kings", "Monroe", "Nassau", "New York", "Queens", "Richmond", "Suffolk", "Westchester")

  ###########################
 #### HELPER FUNCTIONS #####
###########################

parseTractsGeneral <- function(df) {
    parsedDf <- df %>%
        # change all instances of "St. Lawrence County" to "Saint Lawrence County"
        # (the period messes up the regex below)
        mutate(NAME = str_replace(NAME, "St. Lawrence County", "Saint Lawrence County")) %>%
        mutate(county = str_extract(NAME, ".*,")) %>%
        select(-NAME) %>%
        mutate(tract = sub(",.*", "", county)) %>%
        mutate(tract = sub("Census Tract ", "", tract)) %>%
        mutate(county = (str_extract(county, "(?<=,\\s)[[:alpha:]\\s]+(?=,)"))) %>%
        mutate(county = str_replace(county, " County", ""))
    return(parsedDf)
}

parseTractsBlockGroups <- function(df) {
    parsedDf <- df %>%
        # change all instances of "St. Lawrence County" to "Saint Lawrence County"
        # (the period messes up the regex below)
        mutate(NAME = str_replace(NAME, "St. Lawrence County", "Saint Lawrence County")) %>%
        mutate(county = str_extract(NAME, ".*,")) %>%
        select(-NAME) %>%
        mutate(blockGroup = sub(",.*", "", county)) %>%
        mutate(blockGroup = sub("Census Tract ", "", blockGroup)) %>%
        mutate(blockGroup = sub("Block Group ", "", blockGroup)) %>%
        mutate(county = (str_extract(county, "(?<=,\\s)[[:alpha:]\\s]+(?=,)"))) %>%
        mutate(county = str_replace(county, " County", ""))
    return(parsedDf)
}

parseTractsBuckets <- function(df) {        
         parsedDf <- df %>%
        # variables ending in "001" are the sum of all other variables in the same tract.
        # Remove all rows where variable ends in "001"
        filter(!str_detect(variable, "001$")) %>%
        # replace the value of table with the corresponding value from tableNames
        mutate(table = case_when(
            table == "1" ~ "White", #A
            table == "2" ~ "Black", #B
            table == "3" ~ "AIAN", #C
            table == "4" ~ "Asian", #D
            table == "5" ~ "NHOPI", #E
            table == "6" ~ "Other", #F
            table == "7" ~ "2+", #G
            table == "8" ~ "WANH", #H
            table == "9" ~ "Hispanic" #I
        )) %>%
        mutate(income = case_when(
            str_detect(variable, "002$") ~ incomeCategories[1],
            str_detect(variable, "003$") ~ incomeCategories[2],
            str_detect(variable, "004$") ~ incomeCategories[3],
            str_detect(variable, "005$") ~ incomeCategories[4],
            str_detect(variable, "006$") ~ incomeCategories[5],
            str_detect(variable, "007$") ~ incomeCategories[6],
            str_detect(variable, "008$") ~ incomeCategories[7],
            str_detect(variable, "009$") ~ incomeCategories[8],
            str_detect(variable, "010$") ~ incomeCategories[9],
            str_detect(variable, "011$") ~ incomeCategories[10],
            str_detect(variable, "012$") ~ incomeCategories[11],
            str_detect(variable, "013$") ~ incomeCategories[12],
            str_detect(variable, "014$") ~ incomeCategories[13],
            str_detect(variable, "015$") ~ incomeCategories[14],
            str_detect(variable, "016$") ~ incomeCategories[15],
            str_detect(variable, "017$") ~ incomeCategories[16]
        )) %>%
        # As best I can tell, if we remove the _A table we eliminate double counting.  See 
        # https://www.census.gov/newsroom/blogs/random-samplings/2021/08/measuring-racial-ethnic-diversity-2020-census.html
        # So, subset allTracts to exclude rows where table is "White"
        filter(table != "White")
    return(parsedDf)
}


  #########################################################################
 #### ANALYSIS: NUMBER OF TRACTS  / BLOCK GROUPS PER INCOME BRACKET ######
#########################################################################

  nyTract <- get_acs(geography = "tract",
              variables = c(medincome = "B19013_001"), 
              state = "NY", 
              year = 2021)

  nyBlockGroup <- get_acs(geography = "block group",
              variables = c(medincome = "B19013_001"), 
              state = "NY", 
              year = 2021)
              
  medianByTract <- parseTractsGeneral(nyTract)
  medianByBlockGroup <- parseTractsBlockGroups(nyBlockGroup)
  
  ## Charts ##
  
    # Histogram for values of median income by tract in all counties, faceted.
      # select tract or block group df
        medianByTract %>% 
        # medianByBlockGroup %>%
      # select counties to include
        filter(!county %in% c("Monroe", "Richmond")) %>%
        # filter(county == "Westchester") %>%
        filter(county %in% comparableCounties) %>%
      ggplot(aes(x = estimate)) +
      geom_histogram(fill = colorPalette["blue"]) +
      # select labels and title
        labs(
          x = "Median Income (000s)", y = "Frequency (No. of Tracts)", title = "Number of Census Tracts by Median Income and County in NY State"
        ) +
        # labs(
          #   x = "Median Income (000s)", y = "Frequency (No. of Tracts)", 
          # title = "Distribution of Median Income by US Census Tract in Westchester County"
          # ) +
        # labs(
          #   x = "Median Income (000s)", y = "Frequency (No. of Block Groups)", 
          # title = "Distribution of Median Income by US Census Block Group"
          # ) +
      # Select facet_wrap if plotting multiple counties
        facet_wrap(~county, ncol = 2) +
      scale_x_continuous(labels = function(x) x / 1000) +
      theme(
          plot.title = element_text(hjust = 0.5, size = 25),
          axis.text.x = element_text(angle = 90, hjust = 1),
          panel.background = element_rect(fill = "white"), 
          strip.background = element_blank(),
          panel.spacing.y = unit(4, "lines"), 
          axis.title.y = element_text(margin = margin(r = 20, unit = "pt"), size = 15),
          axis.title.x = element_text(margin = margin(t = 20, unit = "pt"), size = 15),
          aspect.ratio = .25
      )

    # lollipop chart showing the standard deviation of median income by county
      nyIncomeDeviation <- 
        # select df
          medianByTract %>% 
          # medianByBlockGroup %>%
        group_by(county) %>%
        summarise(sd = sd(estimate, na.rm = TRUE)) %>%
        arrange(desc(sd))

      nyIncomeDeviation %>% 
          ggplot(aes(x = reorder(county, sd), y = sd)) +
          # select labels and title
            labs(
              x = "County", y = "Distance of Average Census Tract Income From of Median Income", title = "Distance of Average Census Tract Income from County Median by County in New York State"
            ) +
            # labs(
            #   x = "County", y = "Distance of Average Block Group Income From of Median Income", title = "Distance of Average Block Group Income from County Median by County in New York State"
            # ) +
          geom_point(color = colorPalette["blue"], size = 2) +
          geom_segment(aes(xend = reorder(county, -sd), yend = 0), color = colorPalette["blue"]) +
          coord_flip() +
          scale_y_continuous(labels = dollar_format()) +
          theme(  
            panel.background = element_rect(fill = "white"), 
            panel.grid.major.x = element_line(colour = "lightgrey"),
            plot.title = element_text(hjust = .5, size = 25), 
            axis.title.y = element_text(margin = margin(r = 20, unit = "pt"), size = 15),
            axis.title.x = element_text(margin = margin(t = 20, unit = "pt"), size = 15),
            aspect.ratio = 1
          )

  ############################################################
 #### ANALYSIS: NUMBER OF HOUSEHOLDS PER INCOME BRACKET #####
############################################################

  # nydf is a dataframe showing, for each tract in NY as a row in the df, the number of households in different income brackets

  myTables <- c("B19001A", "B19001B", "B19001C", "B19001D", "B19001E", "B19001F", "B19001G", "B19001H", "B19001I")

  nydf <- map_dfr(myTables, ~get_acs(
                      state = "NY",
                      geography = "tract",
                      table = .x,
                      year = 2021
                  ), .id = "table")

  tableNames <- c("White", "Black", "AIAN", "Asian", "NHOPI", "Other", "Two or More", "Two or More (Excluding Other)", "Two or More (Including Other)")

  incomeCategories <- c("<10", "10-14.9", "15-19.9", "20-24.9", "25-29.9", "30-34.9", "35-39.9", "40-44.9", "45-49.9", "50-59.9", "60-74.9", "75-99.9", "100-124.9", "125-149.9", "150-199.9", "200+")

  bucketsByTract <- parseTractsBuckets(parseTractsGeneral(nydf))

  ## Charts ##

    # histogram of the number of households in each income bracket, faceted by county, ignoring tract
    bucketsByTract %>% 
      # select counties to include
        filter(!county %in% c("Monroe", "Richmond")) %>%
        # filter(county == "Westchester") %>%
        filter(county %in% comparableCounties) %>%
      group_by(county, income) %>% 
      summarise(estimate = sum(estimate)) %>%
      ggplot(aes(x = income, y = estimate)) +
      geom_col(fill = colorPalette["blue"]) +
      # select labels and title
        # labs(
        #   x = "Income", y = "Number of Households", 
        #   title = "Number of Households by Income Bracket in Westchester County"
        # ) +
        labs(
          x = "Income", y = "Number of Households", 
          title = "Number of Households by Income Bracket By County in New York State"
        ) +
      # Select facet_wrap if plotting multiple counties
        facet_wrap(~county, ncol = 2) +
      scale_y_continuous(labels = comma_format()) +
      # order the categories in the x axis by the order in incomeCategories
        scale_x_discrete(limits = incomeCategories) +
      theme(
        plot.title = element_text(hjust = 0.5, size = 25),
        axis.text.x = element_text(angle = 90, hjust = 1),
        panel.background = element_rect(fill = "white"), 
        strip.background = element_blank(),
        panel.spacing.y = unit(4, "lines"), 
        axis.title.y = element_text(margin = margin(r = 20, unit = "pt"), size = 15),
        axis.title.x = element_text(margin = margin(t = 20, unit = "pt"), size = 15),
        aspect.ratio = .25
    )
        

  ############################
 #### ANALYSIS: ALICE #######
############################

    nyAlice <- read.csv("DataSheet_NY.csv", header = TRUE, stringsAsFactors = FALSE)

  # subset data to 2021 only, convert to percentages, and pivot to long format
    nyAlice2021 <- nyAlice[nyAlice$Year == 2021,] %>%
      select(Year, County, Households, Poverty.Households, ALICE.Households, 
          Above.ALICE.Households) %>%
          mutate(Below.ALICE.Households = Poverty.Households + ALICE.Households) %>%
          mutate(BelowPct = (Below.ALICE.Households / Households) * 100,
              AbovePct = (Above.ALICE.Households / Households) * 100,
              PovertyPct = (Poverty.Households / Households) * 100,
              ALICEPct = (ALICE.Households / Households) * 100) %>%
              pivot_longer(cols = c(
                "AbovePct", 
                  "PovertyPct", 
                  "ALICEPct"
              )) %>%
      select(County, name, value)

  nyAliceWC2021 <- nyAlice2021 %>% filter(County == "Westchester")

  bucketsByTract_cleaned <- bucketsByTract %>% 
      # select counties to include
        # filter(!county %in% c("Monroe", "Richmond")) %>%
        # filter(county == "Westchester") %>%
        filter(county %in% comparableCounties) %>%
      group_by(county, income) %>% 
      summarise(estimate = sum(estimate)) %>%
      # create startIncome, which is the the characters in "income" before the dash
      mutate(income = ifelse (income == "200+", "200-999", income)) %>%
      mutate(startIncome = ifelse(grepl("-", income), 
                            str_sub(income, 1, str_locate(income, "-") - 1), 
                            income)) %>%
      mutate(startIncome = ifelse(startIncome == "<10", 0, startIncome)) %>%
      mutate(startIncome = as.numeric(na.omit(startIncome)))
      
      # create new income categories for households below poverty line, below double poverty line, below ALICE line, and above ALICE line
      # NOTE: Median persons per household in Westchester is is 2.63, accoring to https://www.census.gov/quickfacts/westchestercountynewyork.  So I'm rounding up to 3, and using the FPL for a household of 3.  That's $21,960 (according to https://aspe.hhs.gov/2021-poverty-guidelines), which I'm rounding down to $20,000 to get to a Census bracket number.

      belowPovRows <- bucketsByTract_cleaned %>%
        filter(startIncome < 20) %>%
        group_by(county) %>%
        summarise(income = "belowPoverty", 
                  estimate = sum(estimate),
                  startIncome = NA)

      belowDoublePovRows <- bucketsByTract_cleaned %>%
        filter(startIncome < 40) %>%
        filter(startIncome >= 20) %>%
        group_by(county) %>%
        summarise(income = "belowDoublePoverty", 
                  estimate = sum(estimate),
                  startIncome = NA)

      belowALICERows <- bucketsByTract_cleaned %>%
        filter(startIncome < 75) %>%
        filter(startIncome >= 40) %>%
        group_by(county) %>%
        summarise(income = "belowALICE", 
                  estimate = sum(estimate),
                  startIncome = NA)

      aboveAliceRows <- bucketsByTract_cleaned %>%
        filter(startIncome >= 75) %>%
        group_by(county) %>%
        summarise(income = "aboveALICE", 
                  estimate = sum(estimate),
                  startIncome = NA)

      bucketsByTract_combined <- 
        bind_rows(
          bucketsByTract_cleaned, 
          belowPovRows, 
          belowDoublePovRows, 
          belowALICERows, 
          aboveAliceRows
        ) %>%
        arrange(county) %>%
        mutate (highLow = ifelse (income == "belowPoverty" | income == "belowDoublePoverty" | income == "belowALICE", "Lower Income", ifelse(income == "aboveALICE", "Higher Income", "Other")))

      allHardshipRows <- bucketsByTract_combined %>%
        filter(
          income == "belowPoverty" | 
          income == "belowDoublePoverty" | 
          income == "belowALICE"
        ) %>%
        group_by(county) %>%
        summarise(
          income = "allHardship",
          estimate = sum(estimate),
          startIncome = NA
        )  

        bucketsByTract_combined <- 
        bind_rows(
          bucketsByTract_combined, 
          allHardshipRows
        ) %>%
        arrange(county)

nyAliceWC2021 <- nyAlice2021 %>% filter(County == "Westchester")

# Stacked bar chart divided into one bar for higher income and one bar for lower income.
bucketsByTract_combined %>%
  # select counties to include
    # filter(!county %in% c("Monroe", "Richmond")) %>%
    filter(county == "Westchester") %>%
  filter(highLow == "Lower Income" | highLow == "Higher Income") %>%
  ggplot(aes(x = highLow, y = estimate, fill = income)) +
  geom_col() +
  labs(
    x = "", y = "Number of Households", 
    title = "Number of Households by Higher / Lower Income in Westchester County"
  ) +
  scale_y_continuous(labels = comma_format()) +
  scale_fill_manual(values=c(
    "aboveALICE"="#7eb0d5", 
    "belowALICE"="#8bd3c7", 
    "belowDoublePoverty"="#ffee65",
    "belowPoverty" = "#ffb55a"
  )) +
  # order the categories in the x axis by the order in incomeCategories
  scale_x_discrete(limits = c("Lower Income", "Higher Income" )) +
  theme(
    panel.background = element_rect(fill = "white"),
    plot.title = element_text(hjust = 0.5, size = 25),
    axis.text.x = element_text(size = 15),
    axis.ticks.x = element_blank(),
  )

# Horizontal stacked bar chart with all counties.  Data wrangling required bcse only negative values are stacked.

  # sort the dataframe by the "AbovePct" section and the original order of the County column

  above_pct_value <- nyAlice2021 %>%
    filter(name == "AbovePct") %>%
    pull(value)

  nyAlice2021_sorted <- nyAlice2021 %>%
    arrange(desc(if_else(name == "AbovePct", value, NA_real_))) %>%
    mutate(adjValue = ifelse(name == "AbovePct", value, -value))

  # Create a data frame with the AbovePct values for each county
  abovePct_df <- nyAlice2021_sorted %>%
    filter(name == "AbovePct") %>%
    select(County, AbovePct = value)

  # Join this data frame to the original one and sort by AbovePct
  nyAlice2021_sorted <- nyAlice2021_sorted %>%
    left_join(abovePct_df, by = "County") %>%
    arrange(desc(AbovePct), County, name)

  nyAlice2021_sorted$County <- fct_inorder(nyAlice2021_sorted$County)
  nyAlice2021_sorted$County <- fct_rev(nyAlice2021_sorted$County)
      

  # 100% horizontal bar chart, all counties
  ggplot(nyAlice2021_sorted, aes(x = County, y = adjValue, fill = as.factor(name))) +
    geom_col(width = 0.3) +
    #scale_fill_manual(values = c("purple", "yellow", "orange")) +
    scale_fill_manual(values = c("AbovePct" = "#bd7ebe", 
                                "PovertyPct" = "#ffb55a", 
                                "ALICEPct" = "#ffee65"))  +
    xlab("") +
    ylab("Value") +
    ggtitle("Horizontal Stacked Bar Plot by Value") +
    coord_flip() +
    theme_minimal()

  ##########################
 #### ANALYSIS: RACE ######
##########################

  # stacked bar chart showing number of households per income bracket by race
  bucketsByTract %>% 
    group_by(county, income, table) %>% 
    summarise(households = sum(estimate)) %>%
    filter(county == "Westchester") %>%
    ggplot(aes(x = income, y = households, fill = table)) +
      geom_col() +
      scale_x_discrete(limits = incomeCategories) +
      labs(x = "Income", y = "Number of Households", title = "Number of Households by Income Bracket by Race In Westchester County") %>%
      scale_fill_manual(values=c(
        "AIAN"="#7eb0d5", 
        "Asian"="#8bd3c7", 
        "Black"="#ffee65",
        "Hispanic" = "#ffb55a",
        "NHOPI" = "#f28e2b",
        "Other" = "#e15759",
        "WANH" = "#4e79a7",
        "2+" = "#b3cde3"
      )) +
      theme(
        panel.background = element_rect(fill = "white"),
        plot.title = element_text(hjust = .5),
        # increase the font size of the x axis labels
        axis.text.x = element_text(size = 11),
        # use commas in y axis labels
        # scale_y_continuous(labels = comma_format())
      )

  # df showing race by income bracket for each county
  countyBracketRace <- bucketsByTract %>%
    group_by(county, income, table) %>%
    summarise(households = sum(estimate))

  # df assigning each row to a race category: white, non-white, or unassigned  
  whiteNotWhite <- countyBracketRace %>%
    mutate(category = case_when(
      table %in% c("AIAN", "Asian", "Black", "Hispanic", "NHOPI", "Other") ~ "Non-White",
      table %in% c("WANH") ~ "White",
      TRUE ~ "Unassigned"
    )) %>%
    group_by(county, income, category) %>%
    summarise(households = sum(households))

  # df assigning each row to a higher or lower income category
  wNW2Groups <- whiteNotWhite %>%   
    mutate(income = case_when(
      income %in% c("<10", "10-14.9", "15-19.9", "20-24.9", "25-29.9", "30-34.9", "35-39.9", "40-44.9", "50-59.9", "60-74.9") ~ "lowerIncome",
      TRUE ~ "higherIncome"
    )) %>%
    group_by(county, income, category) %>%
    summarise(households = sum(households)) %>%
    filter(!category == "Unassigned")

  # for each county in wNW2Groups, calculate the percentage of households in each income / race combination
  waffleCounty <- wNW2Groups %>%
    group_by(county) %>%
    mutate(total_households = sum(households)) %>%
    ungroup() %>%
    mutate(Pct = round((households / total_households * 100)),0) %>%
    # create a column that concatenates the income and category columns
    mutate(Category = paste(income, category, sep = "-")) %>% 
    select(county, Pct, Category) %>%
    # change the order in which rows appear in the Category column
    mutate(Category = factor(Category, levels = c("higherIncome-White", "higherIncome-Non-White", "lowerIncome-White", "lowerIncome-Non-White")))

  # lollipop chart showing distance from "perfect balance" for each county
    waffleCounty %>% group_by(county) %>%
      summarize(sd = sd(Pct)) %>%
      arrange(sd) %>%
      ggplot(aes(x = reorder(county, -sd), y = sd)) +
        geom_point() +
        geom_segment(aes(xend = county, yend = 0)) +
        coord_flip() +
        labs(
          x = "County", y = "Average Distance of Categories from 25% (Pct. Points)", 
          title = "New York Counties Ranked by Distance from \"Perfect Balance\""
        ) +
        theme(
          #color = "lightgrey",
          panel.background = element_rect(fill = "white"), 
          panel.grid.major.x = element_line(colour = "lightgrey"),
          plot.title = element_text(hjust = .5),
          axis.text.y = element_text(hjust = 1)
        )

  # waffle chart 
    wafColors <- brewer.pal(n = 12, name = "Paired")
      
    wafCounty <- waffleCounty %>%
      # select counties to include
        filter(county %in% comparableCounties) %>%
        # filter(county == "Westchester") %>%
        # filter(county %in% c("Westchester", "Nassau", "Suffolk")) %>%
      ggplot(aes(fill = Category, values = Pct)) +
        expand_limits(x=c(0,0), y=c(0,0)) +
        coord_equal() +
        labs(fill = NULL, colour = NULL) +
        theme_ipsum_rc(grid="") +
        theme_enhance_waffle()

    wafCounty +
      geom_waffle(
        n_rows = 10, size = 1, colour = "white", flip = TRUE,
        make_proportional = TRUE,
        # # no nas in my df, but this is needed to avoid an error:
        na.rm = TRUE
      ) +
      facet_wrap(~county, ncol = 2) +
      scale_fill_manual(values = c(wafColors[2], wafColors[8], "#C9E4F5", "#FFD6A1")) +
      guides(fill = guide_legend(reverse = TRUE))

###########   END OF ANALYSIS    #################################

  ###############################
 #### MISSING DATA REVIEW ######
###############################

# TRACT:
#  3.9% of rows in medianByTract (tract level data from B19013_001) have an NA for estimate
  medianByTract %>% 
    filter(is.na(estimate)) %>%
    nrow() / 
    medianByTract %>% nrow()
  
# what percentage of rows in medianByTract for each county have an NA for estimate?
  tractCountByCounty <- medianByTract %>% 
    group_by(county) %>%
    summarise(n = n())

   tractCountNA <- medianByTract %>% 
      group_by(county) %>%
      filter(is.na(estimate)) %>%
      summarise(naCount = n())
      
    # merge the two dfs
    tractCountPCTNA <- tractCountByCounty %>%
      left_join(tractCountNA, by = "county") %>%
      mutate(pctNA = naCount / n * 100) %>%
      # if pctNA is NA, set it to 0
      mutate(pctNA = ifelse(is.na(pctNA), 0, pctNA)) %>%
      filter(county %in% comparableCounties) %>%
      arrange(desc(pctNA))

    # within all counties (run these without filter(county %in% comparableCounties) in the definition of tractCountPCTNA) above
    max(tractCountPCTNA$pctNA) # Tompkins is highest at 15.3%
    nrow(tractCountPCTNA %>% filter(pctNA == 0)) # 25 counties have no NAs
    median(tractCountPCTNA$pctNA) # median percentage of NAs per county is 2.15%

    # within comparable counties (run these with filter(county %in% comparableCounties) in the definition of tractCountPCTNA) above
    max(tractCountPCTNA$pctNA) # Queens is highest at 7.17%
    nrow(tractCountPCTNA %>% filter(pctNA == 0)) # no counties have no NAs
    median(tractCountPCTNA$pctNA) # median percentage of NAs per county is 3.99%

# BLOCK GROUP:
#  11.3% of rows in medianByBlockGroup (block group level data from B19013_001))have an NA for estimate
  medianByBlockGroup %>% 
    filter(is.na(estimate)) %>%
    nrow() / medianByBlockGroup %>% 
    nrow()

# what percentage of rows in medianByBlockGroup for each county have an NA for estimate?

  blockGroupByCounty <- medianByBlockGroup %>% 
    group_by(county) %>%
    summarise(n = n())

   blockGroupCountNA <- medianByBlockGroup %>% 
      group_by(county) %>%
      filter(is.na(estimate)) %>%
      summarise(naCount = n())
      
    # merge the two dfs
    blockGroupCountPCTNA <- blockGroupByCounty %>%
      left_join(blockGroupCountNA, by = "county") %>%
      mutate(pctNA = naCount / n * 100) %>%
      # if pctNA is NA, set it to 0
      mutate(pctNA = ifelse(is.na(pctNA), 0, pctNA)) %>%
      filter(county %in% comparableCounties) %>%
      arrange(desc(pctNA))

    # within all counties (run these without filter(county %in% comparableCounties in the definition of blockGroupCountPCTNA above)
    max(blockGroupCountPCTNA$pctNA) # New York is highest at 25.3%
    nrow(blockGroupCountPCTNA %>% filter(pctNA == 0)) # 6 counties have no NAs
    median(blockGroupCountPCTNA$pctNA) # median percentage of NAs per county is 6.14%

    # within comparable counties (run these with filter(county %in% comparableCounties) in the definition of blockGroupCountPCTNA above)
    max(blockGroupCountPCTNA$pctNA) # New York is highest at 25.7%
    nrow(blockGroupCountPCTNA %>% filter(pctNA == 0)) # no counties have no NAs
    median(blockGroupCountPCTNA$pctNA) # median percentage of NAs per county is 10.36%

# INCOME BY HOUSEHOLD
  # There are no NAs in the estimate for number of households by income bracket (B19001) in the census data:
  bucketsByTract %>% filter(is.na(estimate)) %>% nrow() /
  bucketsByTract %>% nrow()

  # 75% of rows in bucketsByTract have a value of 0 for the estimate (number of households) in the census data.  This sounds high at first blush, but is probably reasonable, given that block groups are relatively "income homogenous", so many block groups will have no households in a given income bucket.
  bucketsByTract %>% 
    filter(estimate == 0) %>%
    nrow() / bucketsByTract %>% 
    nrow()

# ALICE
aliceCheck <- nyAlice[nyAlice$Year == 2021,] %>%
                select(
                  Year, County, Households, Poverty.Households, ALICE.Households, 
                  Above.ALICE.Households
                )

# There are no NAs in any of the rows for any of the columns in the ALICE data:
  aliceCheck %>% 
    filter(!complete.cases(.))%>%
    nrow() /
  aliceCheck %>% nrow()