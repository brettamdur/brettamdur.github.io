#####################
#### SETUP #########
###################

    library(tidycensus)
    library(tidyverse)
    library(scales)
    library(ggrepel)

    # Set working directory
    setwd("~/box/dataj/d3/WCA")

    # Read in data, converting numeric columns to numeric
    nyAlice <- read.csv("DataSheet_NY.csv", header = TRUE, stringsAsFactors = FALSE)

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

########################
#### ANALYSIS #########
######################

# subset data to 2021 only, and convert to percentages
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


above_pct_value <- subset(nyAliceWC2021, name == "AbovePct")$value

# Westchester County only, 100% horizontal bar chart
ggplot(nyAliceWC2021, aes(x = County, y = value, fill = name)) +
geom_col(width = 0.3) +
scale_fill_manual(values = c("purple", "yellow", "orange")) +
xlab("") +
ylab("Value") +
ggtitle("Horizontal Stacked Bar Plot by Value") +
geom_vline(xintercept = above_pct_value, color = "black", size = 1.5) +
coord_flip() + 
theme_minimal()

# Stacked bar chart with all counties.  Significant data wrangling prep required bcse only negative values are stacked.
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




#######################
#### MISC ############
#####################



    ggplot(nyAliceWC2021, aes(x = County, y = value, fill = name)) +
        geom_col(width = 0.3) +
        scale_fill_manual(values = c("red", "green", "blue")) +
        geom_vline(xintercept = nyAliceWC2021$value[1], color = "black", size = 1.5) +
        xlab("") +
        ylab("Value") +
        ggtitle("Horizontal Stacked Bar Plot by Value") +
        coord_flip()

    # Create the stacked bar chart using ggplot
    ggplot(plot_data, aes(x = x_var, y = value, fill = variable)) +
    geom_bar(stat = "identity", position = "stack") +
    scale_fill_manual(values = c("Below ALICE (Poverty)" = "red", "Below ALICE (ALICE)" = "blue", "Above ALICE" = "green")) +
    facet_wrap(~County, ncol = 4) +
    labs(title = "ALICE Households in Westchester County",
        x = "Household Type",
        y = "Number of Households",
        fill = "Household Type") +
    theme_minimal()


  nyAlice2021%>%
  filter(variable %in% c("Above.ALICE.Households", "Poverty.Households", "ALICE.Households")) %>%
  mutate(variable = recode(variable,
                           "Above.ALICE.Households" = "Above ALICE",
                           "Poverty.Households" = "Below ALICE (Poverty)",
                           "ALICE.Households" = "Below ALICE (ALICE)"))

# Calculate the position of the vertical line
vline_position <- max(plot_data$value[plot_data$variable == "Above ALICE"])

# Create the horizontal bar chart using ggplot
ggplot(plot_data, aes(x = value, y = variable, fill = variable)) +
  geom_bar(stat = "identity") +
  # coord_flip() +
  geom_vline(xintercept = vline_position, linetype = "dashed", color = "black", size = 1) +
  scale_fill_manual(values = c("Below ALICE (Poverty)" = "red", "Below ALICE (ALICE)" = "blue", "Above ALICE" = "green")) +
  labs(title = "ALICE Households in Westchester County",
       x = "Number of Households",
       y = "Household Type",
       fill = "Household Type") +
  theme_minimal() +
  

nyAlice[nyAlice$Year == 2021,] %>% 
        select(Year, County, Households, Poverty.Households, ALICE.Households, 
            Above.ALICE.Households) %>%
            filter(County == "Westchester") %>%
            select(-Households, -Year, -County) %>%
            # convert everything except Year and County to numeric
            mutate_if(is.character, as.numeric) %>% 
            rowSums() %>%

# comparing ALICE numbers to ACS numbers
print(bucketsByTract_combined %>% filter(county == "Westchester") %>% arrange(startIncome), n=30)
nyAlice[nyAlice$Year == 2021,] %>% filter(County == "Westchester")