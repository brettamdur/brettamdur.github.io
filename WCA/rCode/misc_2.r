

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
    readRenviron("~/.Renviron")

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
      # select geographic scope
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
      # select geographic scope
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

  # Read in data, converting numeric columns to numeric
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
      # select geographic scope
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

# Stacked bar chart divided into one bar for higher income and  one bar for lower income.
bucketsByTract_combined %>%
  # select geographic scope
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

# Horizontal stacked bar chart with all counties.  Significant data wrangling prep required bcse only negative values are stacked.
  above_pct_value <- nyAlice2021 %>%
    filter(name == "AbovePct") %>%
    pull(value)

  # sort the dataframe by the "AbovePct" section and the original order of the County column
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
 #### ANALYSIS: RACE ####
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
    

  whiteNotWhite <- countyBracketRace %>%
    mutate(category = case_when(
      table %in% c("AIAN", "Asian", "Black", "Hispanic", "NHOPI", "Other") ~ "Non-White",
      table %in% c("WANH") ~ "White",
      TRUE ~ "Unassigned"
    )) %>%
    group_by(county, income, category) %>%
    summarise(households = sum(households))

  wNW2Groups <- whiteNotWhite %>%   
    mutate(income = case_when(
      income %in% c("<10", "10-14.9", "15-19.9", "20-24.9", "25-29.9", "30-34.9", "35-39.9", "40-44.9", "50-59.9", "60-74.9") ~ "lowerIncome",
      TRUE ~ "higherIncome"
    )) %>%
    group_by(county, income, category) %>%
    summarise(households = sum(households)) %>%
    filter(!category == "Unassigned")

  # for each county in wNW2Groups, calculate the percentage of households in each income / category combination
  waffleCounty <- wNW2Groups %>%
    group_by(county) %>%
    mutate(total_households = sum(households)) %>%
    ungroup() %>%
    mutate(Pct = round((households / total_households * 100)),0) %>%
    # create a column that concatenates the income and category columns
    mutate(Category = paste(income, category, sep = "-")) %>% 
    select(county, Pct, Category) %>%
    # change the order in which rows appear, so that it is: lowerIncome-White, lowerIncome-Non-White, higherIncome-White, higherIncome-Non-White
    mutate(Category = factor(Category, levels = c("higherIncome-White", "higherIncome-Non-White", "lowerIncome-White", "lowerIncome-Non-White")))

  # lollipop chart showing distance from "perfect balance" for each county
    waffleCounty %>% group_by(county) %>%
      summarize(sd = sd(Pct)) %>%
      arrange(sd) %>%
      ggplot(aes(x = reorder(county, -sd), y = sd)) +
      # ggplot(aes(x = county, y = sd)) +#   geom_col() +
          geom_point() +
          # geom_segment(aes(xend = reorder(county, sd), yend = 0)) +
          geom_segment(aes(xend = county, yend = 0)) +
          coord_flip() +
          labs(x = "County", y = "Average Distance of Categories from 25% (Pct. Points)", title = "New York Counties Ranked by Distance from \"Perfect Balance\"") +
          # scale_y_continuous(labels = dollar_format()) +
          # make the background white and add vertical grid lines
          theme(panel.background = element_rect(fill = "white"), panel.grid.major.x = element_line(colour = "lightgrey")) +
          theme(plot.title = element_text(hjust = .5),
                  #axis.text.y = element_text(margin = margin(t = 0, r = -30, b = 0, l = 0)))
                  axis.text.y = element_text(hjust = 1))

  # waffle chart 
    wafCounty <- waffleCounty %>%
    filter(county %in% comparableCounties) %>%
    ggplot(aes(fill = Category, values = Pct)) +
      expand_limits(x=c(0,0), y=c(0,0)) +
      coord_equal() +
      labs(fill = NULL, colour = NULL) +
      theme_ipsum_rc(grid="") +
      theme_enhance_waffle()

    wafCounty +
      geom_waffle(
        n_rows = 10, size = 0.33, colour = "white", flip = TRUE,
        make_proportional = TRUE,
        # rotate the chart 180 degrees
        angle = 180
      ) +
      facet_wrap(~county, ncol = 2) +
      scale_fill_manual(values = c("#1f78b4", "#33a02c", "#a6cee3", "pink")) +
      # scale_fill_manual(values = c(colorPalette["blue"], "red", "lightblue", "pink")) +
      # scale_fill_brewer(palette = "Paired") %>%
      guides(fill = guide_legend(reverse = TRUE))
      

      
    
    countyBracketRace %>%
    # whiteNotWhite %>%
    # wNW2Groups %>%
      # filter(county %in% comparableCounties) %>%
      filter(county == "Westchester") %>%
      ggplot(aes(x = income, y = households, fill = table)) +
      # ggplot(aes(x = income, y = households, fill = category)) +
      geom_bar(stat = "identity") +
      labs(x = "Income", y = "Number of Households", title = "Number of Households by Income Bracket by Race In Westchester County") +
      theme(
        plot.title = element_text(hjust = 0.5),
        axis.text.x = element_text(angle = 90, hjust = 1),
        panel.background = 
          element_rect(fill = "white"), 
          panel.grid.major.y = element_line(color = "lightgrey"),
          axis.ticks.x = element_blank()
      ) +
      scale_y_continuous(labels = comma_format()) +
      # order the categories in the x axis by the order in incomeCategories
      scale_x_discrete(limits = incomeCategories) +
      # facet_wrap(~county, ncol = 2) +
      scale_fill_manual(values = c("brown", "blue", "green", "yellow", "purple", "orange", "#ff6780", "red"))

    wNW2Groups %>%
      filter(county %in% comparableCounties) %>%
      ggplot(aes(x = income, y = households, fill = category)) +
      geom_bar(stat = "identity") +
      labs(x = "Income", y = "Number of Households", title = "Number of Households by Income Bracket by Race In Westchester County") +
      theme(
        plot.title = element_text(hjust = 0.5),
        axis.text.x = element_text(angle = 90, hjust = 1),
        panel.background = 
          element_rect(fill = "white"), 
          panel.grid.major.y = element_line(color = "lightgrey"),
          axis.ticks.x = element_blank()
      ) +
      scale_y_continuous(labels = comma_format()) +
      facet_wrap(~county, ncol = 2) +
      scale_fill_manual(values = c("purple", "green")) +
      scale_x_discrete(limits = c("higherIncome", "lowerIncome"))


    

    ########################################################################


    # Is tract income correlated with number of households in the tract?  No.
      # Households per income bracket in Westchester County
      wcHousehold <- bucketsByTract %>% 
        filter(county == "Westchester") %>%
        group_by(tract) %>%
        summarise(households = sum(estimate)) %>%
        arrange(desc(households)) 

      wcMedIncome <- medianByTract %>% 
        filter(county == "Westchester") 

      # add wMedianIncome$estimate to wcHousehold, matching on tract
      wcCombined <- wcHousehold %>% 
        left_join(wcMedIncome, by = "tract")


      # Scatterplot of households vs. median income 
      wcCombined %>% 
        ggplot(aes(x = households, y = estimate)) +
        geom_point() +
        labs(x = "Number of Households", y = "Median Income", title = "Median Income vs. Number of Households By Census Tract in Westchester County") +
        theme(
          plot.title = element_text(hjust = 0.5),
          panel.background = element_rect(fill = "white")
        ) +
        scale_y_continuous(labels = dollar_format()) +
        scale_x_continuous(labels = comma_format()) +
        # add a regression line
        geom_smooth(method = "lm", se = FALSE) +
        # label the top 10 tracts by median income, prevent the texts from overlapping
        # geom_text(data = wcCombined %>% top_n(10, estimate), aes(label = tract)) +
        geom_text_repel(data = wcCombined %>% top_n(10, estimate), aes(label = tract))
        

####################################
####           MISC            ####
##################################


allTractsNoA_countyGroups %>% 
    filter(county == "Bronx") %>%
    ggplot(aes(x = income, y = estimate)) +
    geom_col() +
    labs(x = "Income", y = "Number of Households", title = "Number of Households by Income in Bronx County") +
    theme(plot.title = element_text(hjust = 0.5)) +
    scale_y_continuous(labels = comma_format()) +
    # order the categories in the x axis by the order in incomeCategories
    scale_x_discrete(limits = incomeCategories)


# create a box and whiskers plot from nyTractByCounty showing the distribution of median income by county, sorted from top to bottom in descending order of median income
nyTractByCounty$ordered <- factor(nyTractByCounty$county, levels = nyIncomeDeviation$county)

nyTractByCounty %>% 
  ggplot(aes(x = county, y = estimate)) +
  geom_boxplot() +
  coord_flip() +
  labs(x = "County", y = "Median Income", title = "Distribution of Median Income by County in New York State") +
  theme(plot.title = element_text(hjust = 0.5))

# create a histogram for values of median income in Westchester County
nyTractByCounty %>% 
  filter(county == "Westchester") %>%
  ggplot(aes(x = estimate)) +
  geom_histogram() +
  labs(x = "Median Income", y = "Frequency", title = "Distribution of Median Income in Westchester County") +
  theme(plot.title = element_text(hjust = 0.5)) +
  # add a vertical line at the mean
  geom_vline(aes(xintercept = mean(estimate)), color = "yellow", linetype = "dashed", linewidth = 5)
   






##### USED TO FIND NA COUNTY NAME IN nyTractByCounty #####
# create vector of all NY County names, copied from https://www.p12.nysed.gov/repcrd2005/links/nycounty.shtml
my_data <- read.table(pipe("pbpaste"), header = FALSE, sep = "\t")

my_data <- my_data$V1

# remove the word county from all elements of my_data
my_data <- str_replace_all(my_data, " County", "")

# find values that are in my_data but not in nyIncomeDeviation$county.
# Shows that problem was St. Lawrence County (because of the period).
setdiff(my_data, nyIncomeDeviation$county)


# Use the mtcars dataset as an example
data(mtcars)

# Calculate the standard deviation for each category
grouped_sd <- mtcars %>%
  group_by(gear) %>%
  summarize(sd = sd(mpg)) %>%
  arrange(-sd) # Sort in descending order

# Create a new factor variable with levels ordered by standard deviation
mtcars$gear_ordered <- factor(mtcars$gear, levels = grouped_sd$gear)

# Create the horizontal box and whiskers plot with ggplot2
ggplot(mtcars, aes(x = mpg, y = gear_ordered)) +
  geom_boxplot() +
  labs(y = "Gear", x = "Miles per Gallon") +
  theme_minimal()

# used this to verify that 001 variables are a sum of all other rows in the same tract
hold <- nyHouseholds %>% 
  filter(GEOID == "36001000100") %>%
  # filter this result to only the rows where the variable begins with B19001A
    filter(str_detect(variable, "B19001B"))



# change all instances of "St. Lawrence County" to "Saint Lawrence County"
# (the period messes up the regex below)
nydf <- nydf %>% 
  mutate(NAME = str_replace(NAME, "St. Lawrence County", "Saint Lawrence County"))


# parse the NAME variable into county and tract, keeping the numbers after the decimal point in the tract, but deleting ", New York" from the county name
nyTractByCounty <- nydf %>% 
  mutate(county = str_extract(NAME, ".*,")) %>%
  select(-NAME)


# create a new variable called tract that is everything before the first comma in county
nyTractByCounty <- nyTractByCounty %>% 
  mutate(tract = sub(",.*", "", county)) %>%
  mutate(tract = sub("Census Tract ", "", tract)) %>%
  mutate(county = (str_extract(county, "(?<=,\\s)[[:alpha:]\\s]+(?=,)"))) %>%
  mutate(county = str_replace(county, " County", ""))

  nyIncomeRanked <- nyTractByCounty %>% 
        group_by(county) %>%
        summarise(meanIncome = mean(estimate, na.rm = TRUE)) %>%
        arrange(desc(meanIncome))



    
      
      
      %>%
      ggplot(aes(x = income, y = households)) +
      geom_col() +
      labs(x = "Income", y = "Number of Households", title = "Number of Households by Income Bracket in Westchester County") +
      theme(plot.title = element_text(hjust = 0.5)) +
      scale_y_continuous(labels = comma_format()) +
      # order the categories in the x axis by the order in incomeCategories
      scale_x_discrete(limits = incomeCategories)

  

    # turn wcCombined into long form, using tract as the id variable, and estimate and households as the value variables
    wcCombinedLong <- wcCombined %>% 
      pivot_longer(cols = c("estimate", "households"), names_to = "var", values_to = "value") %>%
      select(tract, var, value)

  # how many tracts in Westchester County have a median income of at least 200,000?
  nrow(medianByTract %>%
    filter(county == "Westchester") %>%
    filter(estimate >= 200000) 
    )

##############################################

three_states <- sample(state.name, 3)

data.frame(
  states = factor(rep(three_states, 3), levels = three_states),
  vals = c(10, 20, 30, 6, 14, 40, 30, 20, 10),
  col = rep(c("blue", "black", "red"), 3),
  fct = c(rep("Thing 1", 3), rep("Thing 2", 3), rep("Thing 3", 3))
) -> xdf

waf <- xdf %>%
  count(states, wt = vals) %>%
  ggplot(aes(fill = states, values = n)) +
  expand_limits(x=c(0,0), y=c(0,0)) +
  coord_equal() +
  labs(fill = NULL, colour = NULL) +
  theme_ipsum_rc(grid="") +
  theme_enhance_waffle()

waf +
  geom_waffle(
    n_rows = 10, size = 0.33, colour = "white", flip = TRUE,
    make_proportional = TRUE
  )

    

waffle_data <- waffle_iron(mpg, aes_d(group = class))

ggplot(waffle_data, aes(x, y, fill = group)) + 
  geom_waffle(n_rows = 10, size = 0.5, color = "white", flip = TRUE) +


  # create a waffle chart for Westchester County
    waffleCounty %>% filter(county == "Westchester") %>%
    # create a vector where the elements are the values of Pct and the name of the element comes from the Category column
    # this is the input for the waffle function
    waffleInput <- waffleCounty %>% filter(county == "Westchester") %>%
      pull(Pct) %>%
      set_names(waffleCounty %>% filter(county == "Westchester") %>% pull(Category))

    # create a waffle chart for each county in wNW2Groups
    wNW2Groups %>%
      filter(county %in% comparableCounties) %>%
      group_by(county) %>%
      mutate(total_households = sum(households)) %>%
      ungroup() %>%
      mutate(Pct = round((households / total_households * 100), 0)) %>%
      # create a column that concatenates the income and category columns
      mutate(Category = paste(income, category, sep = "-")) %>% 
      select(county, Pct, Category) %>%
      group_by(county, .add = TRUE) %>%
      group_split() %>%
      # for each county, create a waffle chart, using the values of Category as label in the legend
      map(~waffle(.x$Pct, rows = 10, size = 0.5, colors = c("lightblue", "blue", "lightgreen", "green"), labels = c("hello", "world", "this", "test"), title = paste(.x$county, "County", sep = " ")))
    

    waffle()


      waffleInput = pull(., Pct) %>% 
      set_names(pull(Category)) %>%
      ungroup() %>%
      mutate(waffleInput = list(waffleInput)) %>%
      mutate(waffleChart = map(waffleInput, ~waffle(.x, rows = 10, size = 0.5, colors = c("#F8766D", "#00BFC4", "#619CFF", "#F564E3", "#00BA38", "#F9BF3B", "#E7B800", "#7E7E7E", "#000000"), title = paste(county, "County", sep = " ")))) %>%
      select(county, waffleChart) %>%
      pull(waffleChart) %>%
      map(~print(.x))

  # waffle chart
    rows <- 10
    cols <- 10
    total_squares <- rows * cols

    # Create a waffle chart faceted by county
    wNW2Groups %>% ggplot(aes(fill = category, values = households)) +
      geom_waffle(n_rows = rows, size = 1, color = "white", flip = TRUE) +
      facet_wrap(~county) +
      scale_x_discrete() +
      scale_y_continuous(expand = c(0, 0), limits = c(0, cols), breaks = NULL) +
      coord_equal() +
      theme_void() +
      theme(legend.title = element_blank(),
            legend.position = "bottom") +
      scale_fill_manual(values = c("darkblue", "darkgreen", "lightblue", "lightgreen"))

mpg$class <- factor(mpg$class, levels = c("subcompact", "compact", "midsize", "suv", "2seater", "minivan", "pickup", "van"))

# Create the waffle chart with the re-ordered levels
waffle_iron(mpg, aes_d(group = class, fill = class))



##############

# Create example data
df <- data.frame(
  x = rnorm(100),
  y = rnorm(100),
  group = rep(LETTERS[1:4], 25)
)

# Define the facet labels
facet_labels <- levels(df$group)

# Create the plot
ggplot(df, aes(x, y)) +
  geom_point() +
  facet_wrap(~ group, labeller = labeller(group = facet_labels)) +
  theme(strip.text = element_text(hjust = 0, margin = margin(r = 10, unit = "pt")))

# What percentage of tracts, by county, have NA for their estimate?
# ANSWER: Queens is highest at 7.17%.  Suffolk is lowest at 1.30% 
# Westchester is 2.07%
  medianByTract %>%
    filter(county %in% comparableCounties) %>%
    group_by(county) %>%
    summarize(pctNA = round((sum(is.na(estimate)) / n()) * 100, 2)) %>%
    arrange(desc(pctNA))

# using bucketsByTract_combined, how many total households are in Westchester?
# ANSWER:  1,000,000
  bucketsByTract %>% filter(county == "Westchester") %>%
    summarize(totalHouseholds = sum(estimate))


#above_pct_value <- subset(nyAliceWC2021, name == "AbovePct")$value